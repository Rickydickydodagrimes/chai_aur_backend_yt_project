// import multer from "multer";

// // storing files in disk storage
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null,  "../public/temp")           // cb = callback, specifies the path where files will be stored (temporarily ofc)
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname)        //callback, specifies the name that the file will be stored with (for now we are using the original name give by the user)
//     }
// });

// export const upload = multer({storage,});

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// FIX for ESM (__dirname not defined)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../../public/temp"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

export const upload = multer({ storage });

