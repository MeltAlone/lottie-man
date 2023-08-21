import * as fs from 'fs-extra';
const path = require('path');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
import { isImage, replaceFile } from './utils';

const compressFile = async (input: string) => {
  if(!isImage(input)) { return; }
  const stat = await fs.stat(input);
  const size = stat.size;

  const [{ data }] = await imagemin([input], {
    plugins: [imageminPngquant()]
  });
  const extName = path.extname(input);
  const destinationPath = input.replace(extName, `.min${extName}`);
  await fs.writeFile(destinationPath, data);
  const newStat = await fs.stat(destinationPath);
  let newSize = newStat.size;

  if(newSize >= size) {
    // 无优化/负优化
    await replaceFile(destinationPath, input);
    newSize = size;
  }
  
  await replaceFile(input, destinationPath);
};

export default compressFile;
