const mongoose = require("mongoose");

const Favorite = mongoose.model("Favorite", {

        id: String,
        name: String,
        description: String,
        picture_path: String,
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
          },
});

module.exports = Favorite;