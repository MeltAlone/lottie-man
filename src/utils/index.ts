import * as fs from 'fs-extra';

const isFile = async (input: string) => {
  const stat = await fs.lstat(input);
  return stat.isFile();
};

const isImage = (path: string) => {
  const reg = /(.png|.jpg|.jpeg)$/;
  return reg.test(path);
};

// find image under folder
const findImages = async (input: string) => {
  const basenames = await fs.readdir(input);
  if (!basenames || basenames.length === 0) {
    return [];
  }
  let images: string[] = [];
  for (let i = 0; i < basenames.length; i++) {
    const basename = basenames[i];
    const _path = `${input}/${basename}`;
    const pathIsFile = await isFile(_path);
    if (!pathIsFile) {
      // if this is a folder then go on find image
      const subImages = await findImages(_path);
      images = [...images, ...subImages];
    } else if (isImage(_path)) {
      images.push(_path);
    }
  }
  return images;
};

const getCompressPercent = (size: number, newSize: number) => {
  return `${((size - newSize) / size * 100).toFixed(2)}%`;
};

// replace oldFile to newFile
const replaceFile = async (oldFile: string, newFile: string) => {
  await fs.remove(oldFile);
  await fs.rename(newFile, oldFile);
};

const delDir = (path: string) =>{
  let files = [];
  if(fs.existsSync(path)){
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
          let curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()){
              delDir(curPath); //递归删除文件夹
          } else {
              fs.unlinkSync(curPath); //删除文件
          }
      });
      fs.rmdirSync(path);
  }
};


const guid = (size :number = 32) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = size; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const getBase64Size = (p: String) => {
  var str = p;
  str = str.substring(22);
  var equalIndex = str.indexOf('=');
  if (str.indexOf('=') > 0) {
    str = str.substring(0, equalIndex);
  }
  var strLength = str.length;
  return Math.floor(strLength - (strLength / 8) * 2);
};


export {
  isFile, findImages, getCompressPercent, isImage, replaceFile, delDir, guid, getBase64Size
};
