const mongoose = require("mongoose");
const postSchema = new mongoose.Schema({
    name:{ type:String, required:true },
    comments:[],
    user:{type: mongoose.Schema.Types.ObjectId}
},{ timestamps: true });

const PostModel = mongoose.model("Post", postSchema);

module.exports = PostModel;