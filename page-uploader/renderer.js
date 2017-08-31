const { ipcRenderer } = require('electron');
const trigger = document.getElementById('trigger');
const fileSubmit = document.getElementById('existingFiles');
const progress = document.getElementById('progress');
let currentFiles = null;

trigger.addEventListener('click', () => {
	let fileList = document.querySelector('#existingFiles ul');
	if(fileList) {
		fileList.remove();
	}

	progress.innerHTML = '';
	ipcRenderer.send('show-dialog');
});

fileSubmit.addEventListener('submit', e => {
	e.preventDefault();
	
	const filesToExclude = checkall.checked?null:checkExcludeFiles();

	ipcRenderer.send('exclude-files', filesToExclude);

	fileSubmit.querySelector('ul').remove();
	fileSubmit.style.display = 'none';
	currentFiles = null;
	progress.innerHTML = '';
});

function checkExcludeFiles() {
	const fileSelection = fileSubmit.querySelectorAll('.file');
	const excludeFiles = [];

	Array.from(fileSelection).forEach(file => {
		if(!file.checked) {
			excludeFiles.push(JSON.parse(file.getAttribute('data-origin')));	
		}
	});

	return (excludeFiles.length > 0)?excludeFiles:null;
}


ipcRenderer.on('files-exist', (event, files, total) => {
	const existingFiles = document.createElement('ul');
	const submit = document.querySelector('#existingFiles input[type="submit"]');
	const checkall = document.getElementById('checkall');
	checkall.checked = true;
	progress.textContent = `You have chosen ${total} files to upload, ${files.length} files already exist. Please select files to override before proceeding:`;
	currentFiles = files;

	for(i in files) {
		const container = document.createElement('li');

		const file = document.createElement('input');
		file.setAttribute('type', 'checkbox');
		file.checked = true;
		file.setAttribute('id', i);
		file.setAttribute('class', 'file');
		file.setAttribute('data-origin', JSON.stringify(files[i]));
		
		if(files[i].file.split('.').pop() === 'xml') {
			file.setAttribute('disabled', 'disabled');
		}

		file.addEventListener('click', e => {
			if(!e.target.checked) {
				checkall.checked = false;
			} else {
				checkall.checked = (checkExcludeFiles() === null);
			}
		});

		const fileName = document.createElement('label');
		fileName.setAttribute('for', i);
		fileName.textContent = files[i].file.split('/').pop();


		container.appendChild(file);
		container.appendChild(fileName);
		existingFiles.appendChild(container);
	}

	fileSubmit.style.display = 'inherit';

	checkall.addEventListener('click', e => {
		const allChecked = e.target.checked;
		Array.from(fileSubmit.querySelectorAll('.file:not(:disabled)')).forEach(input => {
			if(allChecked) {
				input.checked = true;
			} else {
				input.checked = false;
			}
		});
	});

	fileSubmit.insertBefore(existingFiles, submit);
});

ipcRenderer.on('upload-progress', (event, values) => {
	if(values === null) {
		progress.textContent = 'No issues to update';
	} else {
		progress.innerHTML = `<p>Uploaded: ${values.amount} issue${values.amount > 1?'s':''} out of ${values.total}; ${values.files} file${values.files > 1?'s':''} out of ${values.filesTotal}</p>`;
		if(values.ignored !== null) {
			progress.innerHTML += `<p>Ignored: ${values.ignored.length} file${values.ignored.length > 1?'s':''}</p>`;
		}
	}
});