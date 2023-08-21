/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import compressFile from './compress';
import postImgOne from './post-img';
import { isImage, delDir, guid, getBase64Size } from './utils';

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
    const inputDir = `images_${guid(8)}`;
    const imagesDir = `${currentDir}/${inputDir}`;
    fs.mkdirSync(imagesDir);

    // 遍历assets
    assets.forEach((item: any, index: number) => {
      let sourcePath: string;
      const isBase64 = /^data:image\/\w+;base64,/.test(item.p);
      if (item.e === 1 && isBase64) {
        if (getBase64Size(item.p) > limit) {
          sourcePath = imagesDir + '/' + guid(16) + '.png';
          const base64 = item.p.replace(/^data:image\/\w+;base64,/, '');
          const dataBuffer = Buffer.from(base64, 'base64');
          fs.writeFileSync(sourcePath, dataBuffer);
          uploadQueue.push({
            idx: index,
            path: sourcePath
          });
          return (newAssets[index] = {
            ...item,
            u: '',
            p: '',
            e: 0
          });
        } else {
          return (newAssets[index] = item);
        }
      } else if (item.e === 0 && isImage(item.p)) {
        sourcePath = path.join(currentDir, `${item.u}${item.p}`);
        const file = fs.readFileSync(sourcePath);
        if (Buffer.from(file).length > limit * 1024) {
          const newPath = imagesDir + '/' + item.p;
          fs.writeFileSync(newPath, file);
          uploadQueue.push({
            idx: index,
            path: newPath
          });
          return (newAssets[index] = {
            ...item,
            u: '',
            p: '',
            e: 0
          });
        } else {
          const sourceBase64 = `data:image/${sourcePath.split('.').pop()};base64,${file.toString(
            'base64'
          )}`;
          return (newAssets[index] = {
            ...item,
            u: '',
            p: sourceBase64,
            e: 1
          });
        }
      } else {
        return (newAssets[index] = item);
      }
    });
    console.log('uploadQueue: ', uploadQueue);
    await Promise.all(
      uploadQueue.map(async (i: any) => {
        // 压缩

        // try {
        //   await compressFile(i.path);
        // } catch (error) {
        //   console.log('compressFile error: ', error);
        // }

        // 上传
        const res: any = await postImgOne(i.path);
        if (res?.respCode !== -1) {
          newAssets[i.idx] = {
            ...newAssets[i.idx],
            u: '',
            p: `https://pic1.zhuanstatic.com/zhuanzh/${res.respData}`,
            e: 0
          };
        }
      })
    )
      .catch((err) => {
        console.log('Promise.all error: ', err);
      })
      .finally(() => {
        // 处理完成写入文件
        lottieData.assets = newAssets;
        const p = path.join(currentDir, 'lottie_anim.json');
        fs.writeFileSync(p, JSON.stringify(lottieData), 'utf8');
        delDir(imagesDir);
      });
    vscode.window.showInformationMessage('success', { modal: true });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
