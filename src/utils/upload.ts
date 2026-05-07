import axios from "axios";
import FormData from "form-data";

export const uploadToImgBB = async (file: Express.Multer.File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
    formData,
    {
      headers: formData.getHeaders(),
    },
  );

  if (response.data && response.data.data && response.data.data.url) {
    return response.data.data.url;
  }

  throw new Error("Failed to upload image to ImgBB");
};
