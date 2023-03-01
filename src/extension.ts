// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
const fsPromises = require("fs").promises;
import * as stream from 'stream';
import * as path from 'path';
const FormData = require('form-data');
const mime = require('mime-kind');
const axios = require('axios');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "lottie-stand" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('lottieFileHandle', async (uri) => {
    console.log('uri: ', uri);
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user

    // 获取文件路径
    const filePath = uri.path;
    const currentDir = path.dirname(uri.path);

    let fileStr = fs.readFileSync(filePath, 'utf-8');

    // ! 去除文件中的BOM
    if (fileStr.charCodeAt(0) === 0xfeff) {
      fileStr = fileStr.slice(1);
    }

    // 用户输入阈值
    const userInput = await vscode.window.showInputBox({
      title: '阈值',
      value: '20',
      password: false,
      ignoreFocusOut: true,
      placeHolder: '单位KB',
      prompt: '超出的图片将替换为链接'
    });
    const limit = Number(userInput ?? '');
    if (!limit) {
      return;
    }

    // 解析assets
    const lottieData = JSON.parse(fileStr);
    const { assets } = lottieData;
    const newAssets: any = []; // 出来后的assets

    // 需要上传的队列
    const uploadQueue: any = [];

    // 遍历assets
    assets.forEach((item: any, index: number) => {
      let sourceBase64: any;
      let sourcePath: string;
      const isBase64=  /^data:image\/\w+;base64,/.test(item.p);
      console.log('item.e === 1: ', item.e === 1);
      console.log('isBase64: ', isBase64);
      if (item.e === 1 && isBase64) {
        sourcePath = '';
        sourceBase64 = item.p;
      } else if (item.e === 0 && isImage(item.p)) {
        sourcePath = path.join(currentDir, `${item.u}${item.p}`);
        sourceBase64 = `data:image/${sourcePath.split('.').pop()};base64,${fs.readFileSync(sourcePath).toString('base64')}`;
      } else {
        return (newAssets[index] = item);
      }
      if (!sourceBase64) {
        return (newAssets[index] = item);
      }
      newAssets[index] = {
        ...item,
        u: '',
        p: sourceBase64,
        e: 0
      };
      if (Buffer.from(sourceBase64, 'base64')?.length > limit * 1024) {
        uploadQueue.push({
          idx: index,
          source: sourceBase64,
          path: sourcePath
        });
      }
    });

    await Promise.all(uploadQueue.map(async (i: any) => {
      let path = i.path;
      if (!path) {
        path = currentDir +'/'+ Date.now() +'.png';
        const base64 = i.source.replace(/^data:image\/\w+;base64,/, "");
        const dataBuffer = Buffer.from(base64, 'base64');
        await fsPromises.writeFile(path, dataBuffer);
      }
      const res: any = await postImgOne(path);
      console.log('postImgOne res: ', res);
      if (res?.respCode !== -1) {
        newAssets[i.idx] = {
          ...newAssets[i.idx],
          u: '',
          p: `https://pic1.zhuanstatic.com/zhuanzh/${res.respData}`,
          e: 0
        };
      }
    })).catch((err) => { 
      console.log('Promise.all error: ', err);
    }).finally(() => {
    // 处理完成写入文件
      lottieData.assets = newAssets;
      const p = path.join(currentDir, 'lottie_anim.json');
      fs.writeFileSync(p, JSON.stringify(lottieData), 'utf8');
    });
    vscode.window.showInformationMessage('success', { modal: true });
  });

  context.subscriptions.push(disposable);
}

/**图片上传 */
const postImgOne = async (path: any) => {
  return new Promise(async(resolve, reject) => {
    const data = new FormData();
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
      if (mime(fs.createReadStream(path)).ext === 'jpg' || mime(fs.createReadStream(path)).ext === 'jpeg') {
        data.append('outputFormat', 'jpg');
      }
    } catch (error) {
      console.log('error: ', error);
    }
    axios({
      method: 'post',
      headers: {
        ...data.getHeaders()
      },
      url: 'https://mediaproxy.zhuanzhuan.com/media/picture/upload',
      data: data
    })
      .then((response: any) => {
        setTimeout(() => {
          fs.unlinkSync(path);
        }, 2000);
        resolve(response.data);
      })
      .catch((error: any) => {
        reject(error);
      });
  });
};

const isImage = (fileName: string) => {
  let suffix = fileName.split('.').pop();
  const imgList = ['png', 'jpg', 'jpeg', 'bmp', 'gif'];
  return imgList.some((item) => item === suffix);
};
// this method is called when your extension is deactivated


export function deactivate() {}
