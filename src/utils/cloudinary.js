// import { v2 as cloudinary} from "cloudinary";
 import fs from "fs";

// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true
// });



// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null;
//         //uploading file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})
//         //file uploaded successfully
//         console.log('file uploaded to cloudinary', response.url); //public url
//         return response;

//     } catch (error) {
//         console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
//         console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
//         console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);
//         console.error("Cloudinary upload failed:", error);

//         fs.unlinkSync(localFilePath);  //removes local saved temporary file as the upload operation fails
//         return null;
//     }
// }
// export {uploadOnCloudinary}


import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
    
   // console.log("File uploaded to Cloudinary:", response.url);
   fs.unlinkSync(localFilePath)
   
    return response;
    
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};
