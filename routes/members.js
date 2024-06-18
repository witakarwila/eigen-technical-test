var express = require("express");
var router = express.Router();

const MAX_BORROW_LIMIT = 2;
const PENALTY_DURATION_DAYS = 3;

module.exports = (db) => {
    router.get("/", async (req, res) => {
        try {
            var membersRef = db.collection("members");
            var membersSnapshot = await membersRef.get();

            var memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
                var memberData = memberDoc.data();
                var borrowsRef = db.collection("borrows")
                    .where("memberId", "==", memberDoc.ref);

                var borrowsSnapshot = await borrowsRef.get();
                var totalBorrowedBooksCount = borrowsSnapshot.size; 

                return {
                    ...memberData,
                    totalBorrowedBooksCount,
                    id: memberDoc.id
                };
            });

            var membersWithBorrowCounts = await Promise.all(memberPromises);

            res.status(200).json(membersWithBorrowCounts);
        } catch (error) {
            console.error("Error getting member details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    router.post("/:memberId/borrow/:bookId", async (req, res) => {
        var { memberId, bookId } = req.params;

        try {
            var memberRef = db.collection("members").doc(memberId);
            var bookRef = db.collection("books").doc(bookId);
            var now = new Date();
            var dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + 7);

            await db.runTransaction(async (transaction) => {
                var memberDoc = await transaction.get(memberRef);
                var bookDoc = await transaction.get(bookRef);

                if (!memberDoc.exists || !bookDoc.exists) {
                    throw new Error("Member or book not found");
                }

                var memberData = memberDoc.data();
                if (memberData.penaltyEndDate && memberData.penaltyEndDate.toDate() > new Date()) {
                    throw new Error("Member is currently penalized and cannot borrow.");
                }

                var existingBorrowQuery = db.collection("borrows")
                    .where("bookId", "==", bookRef);

                var existingBorrowSnapshot = await transaction.get(existingBorrowQuery);
                if (!existingBorrowSnapshot.empty) {
                    for (const doc of existingBorrowSnapshot.docs) {
                        if (!doc.data().returnedDate) {
                            throw new Error("Book is already borrowed by another member.");
                        }
                    }
                }

                var borrowedBooksSnapshot = await transaction.get(
                    db.collection("borrows")
                        .where("memberId", "==", memberRef)
                );
                var currentlyBorrowedBooks = borrowedBooksSnapshot.docs.filter(doc => {
                    return doc.data().returnedDate === null || doc.data().returnedDate === undefined;
                });
                if (currentlyBorrowedBooks.length >= MAX_BORROW_LIMIT) {
                    throw new Error(`Member has reached the maximum borrow limit of ${MAX_BORROW_LIMIT} books.`);
                }

                transaction.create(db.collection("borrows").doc(), {
                    memberId: memberRef,
                    bookId: bookRef,
                    borrowDate: now,
                    dueDate: dueDate
                });
            });

            res.status(200).json({ message: "Book borrowed successfully" });
        } catch (error) {
            console.error("Error borrowing book:", error);
            res.status(400).json({ error: error.message });
        }
    });


    router.post("/:memberId/return/:bookId", async (req, res) => {
        var { memberId, bookId } = req.params;

        try {
            var memberRef = db.collection("members").doc(memberId);
            var bookRef = db.collection("books").doc(bookId);
            let daysLate = 0;

            await db.runTransaction(async (transaction) => {
                var memberDoc = await transaction.get(memberRef);
                var bookDoc = await transaction.get(bookRef);

                if (!memberDoc.exists || !bookDoc.exists) {
                    throw new Error("Member or book not found");
                }

                var borrowsQuery = db.collection("borrows")
                    .where("memberId", "==", memberRef)
                    .where("bookId", "==", bookRef);

                var borrowsSnapshot = await transaction.get(borrowsQuery);
                
                var activeBorrow = borrowsSnapshot.docs.find(doc => !doc.data().returnedDate);
                
                if (!activeBorrow) {
                    throw new Error("This book has already been returned by the member or was never borrowed");
                }

                var now = new Date();
                var dueDate = activeBorrow.data().dueDate.toDate();

                daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));

                transaction.update(activeBorrow.ref, { returnedDate: now });

                if (daysLate > 0) {
                    var penaltyEndDate = new Date();
                    penaltyEndDate.setDate(penaltyEndDate.getDate() + PENALTY_DURATION_DAYS);

                    transaction.update(memberRef, { penaltyEndDate: penaltyEndDate });
                }
            });
            res.status(200).json({ 
                message: `Book returned successfully. ${daysLate > 0 ? `Member is penalized for ${PENALTY_DURATION_DAYS} days.` : ''}`,
                isPenalized: daysLate > 0 
            }); 
        } catch (error) {
            console.error("Error returning book:", error);
            res.status(400).json({ error: error.message });
        }
    });


    return router;
};
