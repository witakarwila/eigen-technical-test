var express = require("express");
var router = express.Router();

module.exports = (db) => {
    router.get("/", async (req, res) => {
        try {
            var booksRef = db.collection("books");
            var booksSnapshot = await booksRef.get();

            var borrowsRef = db.collection("borrows");
            var borrowsSnapshot = await borrowsRef.get(); // Get all borrows
            var borrowedBookIds = borrowsSnapshot.docs.map(doc => doc.data().bookId.id);

            var availableBooks = booksSnapshot.docs.filter(bookDoc => {
                return !borrowedBookIds.includes(bookDoc.id);
            }).map(bookDoc => {
                return {
                    id: bookDoc.id,
                    ...bookDoc.data()
                };
            });

            res.status(200).json(availableBooks);
        } catch (error) {
            console.error("Error getting available books:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    return router;
};