import * as fs from 'fs';
const formData = require('form-data');
const mime = require('mime-kind');
const axios = require('axios');

/**图片上传 */
const postImgOne = async (path: string) => {
  const data = new formData();
  // const rs = fs.createReadStream(path) 当使用 `fs.createReadStream()` 方法读取文件时，如果将读取流赋值给变量并没有正确地处理流事件，就可能导致文件读取失败。
  data.append('multipartFile', fs.createReadStream(path));
  data.append('path', '/zhuanzh/');
  const sign = Buffer.from(encodeURIComponent(Date.now()))
    .toString('base64')
    .split('')
    .reverse()
    .join('');
  data.append('sign', sign);

  try {
    if (
      mime(fs.createReadStream(path)).ext === 'jpg' ||
      mime(fs.createReadStream(path)).ext === 'jpeg'
    ) {
      data.append('outputFormat', 'jpg');
    }
  } catch (error) {
    console.log('error: ', error);
  }

  try {
    const response = await axios({
      method: 'post',
      headers: {
        ...data.getHeaders()
      },
      url: 'https://mediaproxy.zhuanzhuan.com/media/picture/upload',
      data: data
    });

    if (response) {
      return response.data;
    }
  } catch (error) {
    console.log('error: ', error);
  } finally {
    setTimeout(() => {
      fs.unlinkSync(path);
    }, 2000);
  }
};

export default postImgOne;
