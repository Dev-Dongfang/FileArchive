# coding=utf-8


'''
输入一个本地md文件，此脚本会将md文件中资源本地化并将资源存放在一个同名文件夹中。
'''


import os
import re
import shutil
from urllib.request import urlretrieve
import sys


class LocalizeMDMaterial:
    def __init__(self, path):
        self.filePath = path

    def localzition(self):
        # 1.获取文件全路径并检查路径是否正确
        print("目标文件路径：" + self.filePath)
        path = self.__refactorMDFilePath(self.filePath)
        if (len(path) <= 0):
            self.__printErrorMessage('请检查文件格式或者路径是否正确！！！');
            return

        #切换工作目录
        fileLocation = os.path.split(self.filePath)
        os.chdir(fileLocation[0])
        #创建目标文件夹
        targetFloder = fileLocation[1].split('.')[0]
        targetPath = os.path.join('./', targetFloder)
        targetImagePath = './images'
        if os.path.exists(targetPath):
            raise Exception("文件夹非空，请删除！！！")
        os.makedirs(targetPath)
        os.chdir(targetPath)
        os.makedirs(targetImagePath)

        #2.读取文件所有内容
        file = open(path, 'r')
        content = file.read()
        file.close()

        #3.使用正则匹配得到所有的图片以及图片字符串位置
        pattern = re.compile(r'!\[.*\)')
        rets = pattern.findall(content)

        #4.循环遍历本地化所有图片
        pathMap = self.__retriveAndMoveImages(rets, targetImagePath)
        #5.读取文件，替换路径后重新写入文件
        for key in pathMap:
            content = content.replace(key, pathMap[key])
        f = open(os.path.join('./', fileLocation[1]), 'w')
        f.write(content)
        f.close()

        print("===================成功===================")

    def __refactorMDFilePath(self, path):
        "检查md文件路径是否正确"
        #1.如果不是md结尾的文件则返回空路径
        if (path.endswith('.md') == False):
            return ''
        #2.如果给出的是完整路径，则进行下一步，否则使用当前工作路径拼接到前面
        if (path.startswith('/')):
            return path
        else:
            return os.path.join(os.getcwd(), path)

    def __retriveAndMoveImages(self, frags, targetImagePath):
        """去除图片位置并移动到固定位置"""
        pathMap = {}
        for frag in frags:
            path = re.search(r'\(.*\)', frag).group().removeprefix('(').removesuffix(')')
            fileName = os.path.split(path)[1]
            if path.startswith('http'):
                #从网络下载资源
                imagePath = os.path.join(targetImagePath, fileName)
                urlretrieve(path, imagePath)
                pathMap[frag] = frag.replace(path, imagePath)
                print("成功下载：" + path)
            else:
                #从指定位置copy资源
                shutil.copy(path, targetImagePath)
                imagePath = os.path.join(targetImagePath, fileName)
                pathMap[frag] = frag.replace(path, imagePath)
                print("成功copy：" + path)
        return pathMap


    def __printErrorMessage(self, msg):
        print('-----------------Error Message-----------------️')
        print(msg)
        print('-----------------Error Message-----------------️')


if __name__ == '__main__':
    argv = sys.argv
    if len(argv) != 2:
        print("请检查输入参数：需要且只能输入一个参数")
        exit(0)

    localize = LocalizeMDMaterial(argv[1])
    localize.localzition()
