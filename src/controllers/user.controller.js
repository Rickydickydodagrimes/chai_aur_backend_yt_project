import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

//5. seperate method for generating tokens
const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user  = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        //saving refresh token to DB
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (err){
        console.log(err.message)
        throw new apiError(500, "something went wrond while generating refresh and access tokens")
        
    }
}

//registering user
const registerUser = asyncHandler(async (req, res) => {
    //steps
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

//login user
const loginUser = asyncHandler(async (req, res) => {
    
    /*Steps
    1. data from req body
    2. username or email login
    3. find the user
    4. password validation
    5. access & refresh token generation
    6.  send tokens via secure cookies
    */

    //1. getting user data
    const {email, username, password} = req.body;
    console.log(email);
    
    if(!username && !email){                       // (!(username || email))
        throw new apiError(400, "username or email is required");
    }

    //2. finding the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new apiError(404, "User doesnt exist")
    }
   
    // password validation
   const isPasswordValid =  await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new apiError(401, "invalid user credentials")
   }

   //5. generating access and refresh tokens
   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

   //6. sending cookies
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options ={
    httpOnly: true,
    secure: false
  }

  return res.status(200).cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new apiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken   //data object 
            //good practice to send tokens here again( maybe the user wants to save cookies etc)
        },
        "User logged in succesfully"
    )
  )
    
})

// logging out user
// 1. clear cookies
// 2. clear tokens
const logoutUser = asyncHandler( async (req, res) => {
   await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
   )

   const options = {
    httpOnly: true,
    secure: false
   }

   return res.status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json( new apiResponse(200, {}, "User logged out"))
})


//refreshing access token for new session
const refreshAccessToken = asyncHandler (async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new apiError(401, "Unauthorized request")
    }
     
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
     )
 
    const user = await User.findById(decodedToken?._id);
 
    if (!user) {
     throw new apiError(401, "Invalid refresh token")
    }
 
    if (incomingRefreshToken !== user?.refreshToken) {
     throw new apiError(401, "Refresh token expired or used")
    }
 
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
    const options = {
     httpOnly: true,
     secure: false
    }
 
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
     new apiResponse(
         200,
         {accessToken, newRefreshToken},
         "Access token refreshed"
     )
    )
   } catch (error) {
     throw new apiError(401, error?.message || "Invalid refresh token")
   }


})

    
  


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};  
