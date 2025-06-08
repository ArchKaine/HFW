const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// --- Configuration ---
const sourceHtmlFile = 'index.html';
const outputDir = 'sections';
const manifestFile = 'sections.json'; 
const masterManifestFile = 'master_manifest.json';
const idsToSkip = [
    'spectre-viewer-wrapper' 
];
// --------------------

const command = process.argv[2] || 'split';
const args = process.argv.slice(3);


// === FUNCTION DEFINITIONS ===

function splitHtmlFile() {
    console.log('--- Running: SPLIT / REFRESH Operation ---');
    const absoluteSourcePath = path.join(__dirname, sourceHtmlFile);
    let htmlContent;
    try {
        htmlContent = fs.readFileSync(absoluteSourcePath, 'utf8');
        console.log(`Successfully read source file: ${absoluteSourcePath}`);
    } catch (error) {
        console.error(`Error: Could not read source file "${absoluteSourcePath}".`);
        return;
    }

    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const container = document.querySelector('.container');
    if (!container) {
        console.error('Error: Could not find <div class="container">.');
        return;
    }

    // Add a class to the body tag to signify it needs dynamic content
    document.body.classList.add('dynamic-load');

    const absoluteOutputPath = path.join(__dirname, outputDir);
    if (!fs.existsSync(absoluteOutputPath)) fs.mkdirSync(absoluteOutputPath);

    const sections = container.querySelectorAll(':scope > section[id], :scope > div[id]');
    const sectionOrderManifest = [];
    const sectionsToRemove = [];
    let filesWritten = 0;

    sections.forEach((section) => {
        const id = section.getAttribute('id');
        if (!id) return;
        if (idsToSkip.includes(id)) {
            sectionOrderManifest.push({ type: 'skipped', id: id });
        } else {
            const filename = id.replace(/^(spectre-)/, '').replace('-wrapper', '') + '.html';
            sectionOrderManifest.push({ type: 'section', filename: filename });
            sectionsToRemove.push(section);

            const outputPath = path.join(absoluteOutputPath, filename);
            try {
                fs.writeFileSync(outputPath, section.outerHTML, 'utf8');
                filesWritten++;
            } catch (error) {
                console.error(`Error writing file ${outputPath}:`, error);
            }
        }
    });

    sectionsToRemove.forEach(section => section.remove());

    try {
        const manifestPath = path.join(absoluteOutputPath, manifestFile);
        fs.writeFileSync(manifestPath, JSON.stringify(sectionOrderManifest, null, 4), 'utf8');
        console.log(`Successfully wrote manifest file: ${path.join(outputDir, manifestFile)}`);
    } catch (error) {
        console.error(`Error writing manifest file:`, error);
    }
    
    try {
        fs.writeFileSync(absoluteSourcePath, dom.serialize(), 'utf8');
        console.log(`Successfully updated "${sourceHtmlFile}" to be a content shell.`);
    } catch (error) {
        console.error(`Error writing updated index.html:`, error);
    }

    console.log(`\nProcess complete. Wrote ${filesWritten} section files.`);
}

// ... (All other functions: recombine, clean, check, new, master, help, getManifest remain the same) ...
function recombineHtmlFiles() {
    console.log('--- Running: UNDO (Re-combine) Operation ---');
    const absoluteSourcePath = path.join(__dirname, sourceHtmlFile);
    const manifest = getManifest();
    if (!manifest) return;
    let templateHtml;
    try {
        templateHtml = fs.readFileSync(absoluteSourcePath, 'utf8');
    } catch (error) {
        console.error(`Error reading template file "${sourceHtmlFile}".`);
        return;
    }
    const templateDom = new JSDOM(templateHtml);
    const templateDocument = templateDom.window.document;
    let combinedHtmlContent = '';
    let sectionsRecombined = 0;
    manifest.forEach(item => {
        if (item.type === 'section') {
            const filePath = path.join(__dirname, outputDir, item.filename);
            try {
                combinedHtmlContent += fs.readFileSync(filePath, 'utf8') + '\n';
                sectionsRecombined++;
            } catch {
                console.warn(`Warning: File "${item.filename}" from manifest was not found. Skipping.`);
            }
        } else if (item.type === 'skipped') {
            const skippedElement = templateDocument.getElementById(item.id);
            if (skippedElement) {
                combinedHtmlContent += skippedElement.outerHTML + '\n';
            }
        }
    });
    const finalDom = new JSDOM(templateHtml);
    const finalContainer = finalDom.window.document.querySelector('.container');
    finalContainer.innerHTML = combinedHtmlContent;
    // Remove the dynamic-load class during undo
    finalDom.body.classList.remove('dynamic-load');
    try {
        fs.writeFileSync(absoluteSourcePath, finalDom.serialize(), 'utf8');
        console.log(`\nSuccessfully recombined ${sectionsRecombined} sections and restored skipped content into "${sourceHtmlFile}".`);
    } catch (error) {
        console.error(`Error writing to "${sourceHtmlFile}":`, error);
    }
}
function createMasterManifest() {
    console.log('--- Running: MASTER Operation ---');
    const absoluteSourcePath = path.join(__dirname, sourceHtmlFile);
    if (!fs.existsSync(absoluteSourcePath)) {
        console.error(`Error: Source file "${sourceHtmlFile}" not found.`);
        return;
    }
    const htmlContent = fs.readFileSync(absoluteSourcePath, 'utf8');
    const dom = new JSDOM(htmlContent);
    const container = dom.window.document.querySelector('.container');
    if (!container) {
        console.error('Error: Could not find <div class="container"> in source HTML.');
        return;
    }
    const sections = container.querySelectorAll(':scope > section[id], :scope > div[id]');
    
    const manifest = [];
    sections.forEach(section => {
        const id = section.getAttribute('id');
        if (!id) return;
        if (idsToSkip.includes(id)) {
            manifest.push({ type: 'skipped', id: id });
        } else {
            const filename = id.replace(/^(spectre-)/, '').replace('-wrapper', '') + '.html';
            manifest.push({ type: 'section', filename: filename });
        }
    });
    const masterManifestPath = path.join(__dirname, masterManifestFile);
    try {
        fs.writeFileSync(masterManifestPath, JSON.stringify(manifest, null, 4), 'utf8');
        console.log(`Successfully created master manifest: ${masterManifestFile}`);
    } catch (error) {
        console.error(`Error writing master manifest file:`, error);
    }
}
function cleanOutput() {
    console.log('--- Running: CLEAN Operation ---');
    const absoluteOutputPath = path.join(__dirname, outputDir);
    if (fs.existsSync(absoluteOutputPath)) {
        try {
            fs.rmSync(absoluteOutputPath, { recursive: true, force: true });
            console.log(`Successfully deleted directory: ${absoluteOutputPath}`);
        } catch (error) {
            console.error(`Error deleting directory ${absoluteOutputPath}:`, error);
        }
    } else {
        console.log(`Directory /${outputDir} does not exist. Nothing to clean.`);
    }
}
function checkIntegrity() {
    console.log('--- Running: CHECK Operation ---');
    const manifest = getManifest();
    if (!manifest) return;
    let warnings = 0;
    let errors = 0;
    const manifestFiles = manifest.filter(item => item.type === 'section').map(item => item.filename);
    const sectionsPath = path.join(__dirname, outputDir);
    const actualFiles = fs.existsSync(sectionsPath) ? fs.readdirSync(sectionsPath).filter(f => f.endsWith('.html')) : [];
    actualFiles.forEach(file => {
        if (!manifestFiles.includes(file)) {
            console.warn(`WARNING: File "${file}" exists in /sections but is not listed in the manifest.`);
            warnings++;
        }
    });
    manifestFiles.forEach(filename => {
        if (!actualFiles.includes(filename)) {
            console.error(`ERROR: File "${filename}" is listed in the manifest but does not exist in /sections.`);
            errors++;
        }
    });
    if (warnings === 0 && errors === 0) {
        console.log('Success: Project integrity check passed.');
    } else {
        console.log(`\nCheck complete. Found ${errors} error(s) and ${warnings} warning(s).`);
    }
}
function createNewSection(title) {
    console.log(`--- Running: NEW Operation for title: "${title}" ---`);
    if (!title) {
        showHelp();
        return;
    }
    const workingManifestPath = path.join(__dirname, outputDir, manifestFile);
    if (!fs.existsSync(workingManifestPath)) {
        console.error(`Error: Working manifest "${manifestFile}" not found. Please run the split command first.`);
        return;
    }
    const sanitizedTitle = title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const newId = `hfw-${sanitizedTitle}`;
    const newFilename = `${sanitizedTitle}.html`;
    const newFilePath = path.join(__dirname, outputDir, newFilename);
    if (fs.existsSync(newFilePath)) {
        console.error(`Error: A file named "${newFilename}" already exists.`);
        return;
    }
    const newHtmlContent = `\n<section class="section" id="${newId}">\n  <h2>\n    ${title}\n    <a class="back-to-top" href="#spectre-top">[Back to Top]</a>\n  </h2>\n  <p>\n    Content for the new section goes here.\n  </p>\n</section>\n`;
    fs.writeFileSync(newFilePath, newHtmlContent.trim(), 'utf8');
    console.log(`Successfully created new file: ${path.join(outputDir, newFilename)}`);
    const manifest = JSON.parse(fs.readFileSync(workingManifestPath, 'utf8'));
    manifest.push({ type: 'section', filename: newFilename });
    fs.writeFileSync(workingManifestPath, JSON.stringify(manifest, null, 4), 'utf8');
    console.log(`Successfully updated ${manifestFile}.`);
    console.log("\nNOTE: New section added to the end. Run 'undo' to rebuild index.html.");
}
function getManifest() {
    const workingManifestPath = path.join(__dirname, outputDir, manifestFile);
    const masterManifestPath = path.join(__dirname, masterManifestFile);
    if (fs.existsSync(workingManifestPath)) {
        return JSON.parse(fs.readFileSync(workingManifestPath, 'utf8'));
    } else if (fs.existsSync(masterManifestPath)) {
        return JSON.parse(fs.readFileSync(masterManifestPath, 'utf8'));
    } else {
        return null;
    }
}
function showHelp() {
    console.log(`
    HFW Document Management Script - Help & Usage
    Usage: node split-sections.js [command] ["arguments"]
    ---------------------------------------------------------------------
    Commands:
      split / refresh   (Default) Splits index.html, creating a manifest and a content shell.
      undo              Recombines section files back into index.html using a manifest.
      master            Creates a 'master_manifest.json' from index.html as a backup.
      check             Validates project integrity between the manifest and files.
      new "Title"       Creates a new section file and adds it to the manifest.
      clean             Deletes the entire /sections directory.
      help              Displays this help message.
    `);
}
switch (command) {
    case 'split': case 'refresh': splitHtmlFile(); break;
    case 'undo': recombineHtmlFiles(); break;
    case 'clean': cleanOutput(); break;
    case 'check': checkIntegrity(); break;
    case 'new': createNewSection(args.join(' ')); break;
    case 'master': createMasterManifest(); break;
    case 'help': showHelp(); break;
    default: console.log(`\nUnknown command: "${command}".`); showHelp(); break;
}