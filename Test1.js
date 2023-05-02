const fs = require('fs');
const path = require('path');

class FileCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir);
    }
  }

  set(key, value, ttl) {
    const data = {
      value: value,
      expiry: Date.now() + ttl * 1000
    };
    const cachePath = path.join(this.cacheDir, key + '.json');
    fs.writeFileSync(cachePath, JSON.stringify(data));
  }

  get(key) {
    const cachePath = path.join(this.cacheDir, key + '.json');
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    const data = JSON.parse(fs.readFileSync(cachePath));
    if (data.expiry < Date.now()) {
      this.delete(key);
      return null;
    }
    return data.value;
  }

  delete(key) {
    const cachePath = path.join(this.cacheDir, key + '.json');
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  }

  clear() {
    fs.readdirSync(this.cacheDir)
      .filter(file => file.endsWith('.json'))
      .forEach(file => fs.unlinkSync(path.join(this.cacheDir, file)));
  }
}

module.exports = FileCache;
