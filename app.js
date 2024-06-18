var express = require("express");
var swaggerUi = require("swagger-ui-express");
var swaggerDocument = require("./swagger.json");
var cors = require("cors");
var bookRoutes = require("./routes/books");
var memberRoutes = require("./routes/members");

require('dotenv').config();

var db = require("./config/firebase");

var app = express();
var port = process.env.TEST_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/books", bookRoutes(db));
app.use("/members", memberRoutes(db));
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Library app listening at http://localhost:${port}`);
});
