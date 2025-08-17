import * as promiseFs from "fs/promises";
/**
 *checks if a file exists
 *@param path path of directory to delete
 */
const isFileExists = async (path: string): Promise<boolean> => {
  let isFileExistsFlag = false;
  try {
    const stats = await promiseFs.stat(path);
    if (stats.isFile()) {
      isFileExistsFlag = true;
    }
  } catch (e) {
    isFileExistsFlag = false;
  }
  return isFileExistsFlag;
};

export { isFileExists };
