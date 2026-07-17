import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

const replacements = [
  { from: /@\/shared\/store\/auth\.store/g, to: '@/features/auth/store/auth.store' },
  { from: /@\/shared\/context\/toast\.context/g, to: '@/components/toast/toast.context' },
  { from: /@\/pages\/auth\/LoginPageCustom/g, to: '@/features/auth/pages/LoginPageCustom' },
  { from: /@\/pages\/dashboard\/Home/g, to: '@/features/dashboard/pages/Home' },
  { from: /@\/shared\/types\/user\.types/g, to: '@/features/auth/types/user.types' },
  { from: /@\/shared\/types\/login-log\.types/g, to: '@/features/auth/types/login-log.types' },
  { from: /@\/components\/theme-provider\.tsx/g, to: '@/app/providers/theme-provider.tsx' },
  { from: /\.\.\/store\/auth\.store/g, to: '@/features/auth/store/auth.store' },
  { from: /\.\.\/types\/user\.types/g, to: '@/features/auth/types/user.types' },
  { from: /\.\.\/context\/toast\.context/g, to: '@/components/toast/toast.context' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
