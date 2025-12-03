import multer from "multer";


// storing files in disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "/public/temp")           // cb = callback, specifies the path where files will be stored (temporarily ofc)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)        //callback, specifies the name that the file will be stored with (for now we are using the original name give by the user)
    }
});

export const upload = multer({storage,});

