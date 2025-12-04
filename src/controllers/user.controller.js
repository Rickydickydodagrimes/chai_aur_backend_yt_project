import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
    /*registering user
    1. get user details from frontend (according to ur db model)
    2. Validations - inputs not empty etc
    3. check if user already exists (via username, email etc)
    4. check for images, avatar
    5. if images and avatar exist, then upload them to cloudinary
    6. create user object - create entry in DB
    7. remove password and refresh token from response 
    8. check if user creating is successful or not
    9. return response
    */

    //1. getting user details

    const {fullName, email, username, password} = req.body;

    console.log("email : ", email);

    // if(fullName === ""){
    //     throw new apiError(400, "full name is required")
    // }

    //2. validations
    //validating that the fields are not empty
    if(
        [fullName, email, username, password].some((field)=> field?.trim() === "") 
    ) {
        throw new apiError(400, "All fields are required")
    }

    //3. checking if the user already exists (by username and email)
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
 
    if(existingUser){
        throw new apiError(409, "User with this email or username already exists")
    }

    //4. checking for avatar and images
     //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    //avatar is required
    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required")
    }
    
    //5. uploading images, avatar to cloudinary
     const avatar = await uploadOnCloudinary(avatarLocalPath);
     console.log("Cloudinary avatar result:", avatar);
     const coverImage = await uploadOnCloudinary(coverImageLocalPath);
     

     if(!avatar){
        throw new apiError(400, "Avatar is required")
     }

    //6.creating user object (entry in DB)
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //validating user creation and removing password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new apiError(500, "Something went wrong while registring user")
    }

    //7. returning response
    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )

})

export {registerUser};  
