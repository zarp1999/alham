const test = require('node:test');
const assert = require('node:assert/strict');
const {setTheme,getTheme,themeColor,themeOptions} = require('../.test-build/theme');
test('themes change the shared palette and invalid saved values fall back safely', () => {
  for (const option of themeOptions) {
    setTheme(option.id);
    assert.equal(getTheme(),option.id);
    assert.equal(themeColor('#266C53'),option.accent);
    assert.equal(themeColor('#FFFFFF'),'#FFFFFF');
  }
  setTheme('unknown'); assert.equal(getTheme(),'green');
  setTheme(null); assert.equal(themeColor('#266C53'),'#266C53');
});

test('display mode follows the system or an explicit choice', () => {
 const {setDisplayMode,setSystemDark,isDark,themeSurface,themeTextColor}=require('../.test-build/theme');
 setSystemDark(true); setDisplayMode('system'); assert.equal(isDark(),true); assert.equal(themeSurface(),'#1D2927');
 setDisplayMode('light'); assert.equal(isDark(),false); assert.equal(themeSurface(),'#FFFFFF');
 setSystemDark(false); setDisplayMode('dark'); assert.equal(isDark(),true); assert.equal(themeTextColor('#266C53'),'#8DD8B5');
 setDisplayMode(null); assert.equal(isDark(),false);
});
