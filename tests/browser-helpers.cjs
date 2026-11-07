'use strict';
async function enterCharacter(page){
 await page.waitForFunction(()=>Boolean(window.everwild));
 if(await page.locator('#new-character-name').count()){await page.locator('#new-character-name').fill('Wayfarer');await page.locator('[data-action="create-character"]').click();}
 else if(await page.locator('[data-action="enter-character"]').count())await page.locator('[data-action="enter-character"]').click();
}
module.exports={enterCharacter};
