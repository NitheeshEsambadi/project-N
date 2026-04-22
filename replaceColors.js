const fs = require('fs'); 
const path = require('path');

const walkSync = function(dir, filelist) {
  var files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const pages = walkSync('./client/src/pages');
const components = walkSync('./client/src/components');
const files = [...pages, ...components].filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let before = c;
  c = c.replace(/color:\s*['"]white['"]/g, "color: 'var(--text-main)'");
  c = c.replace(/color:\s*['"]#fff(?:fff)?['"]/g, "color: 'var(--text-main)'");
  c = c.replace(/background:\s*['"]rgba\(0,0,0,0\.2\)['"]/g, "background: 'var(--card-bg)'");
  c = c.replace(/background:\s*['"]rgba\(0,0,0,0\.8\)['"]/g, "background: 'rgba(0,0,0,0.5)'");
  c = c.replace(/background:\s*['"]rgba\(255,255,255,0\.03\)['"]/g, "background: 'var(--hover-bg)'");
  c = c.replace(/background:\s*['"]rgba\(255,255,255,0\.1\)['"]/g, "background: 'var(--hover-bg)'");
  c = c.replace(/color:\s*['"]black['"]/g, "color: 'white'"); // Some initial text was black on gold, in pastel we might want contrasting
  if (before !== c) {
    fs.writeFileSync(f, c);
    console.log('Updated', f);
  }
});
