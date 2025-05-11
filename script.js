document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const previewContainer = document.getElementById('previewContainer');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loading = document.getElementById('loading');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // File handling
    let files = [];

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-color)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/'));
        handleFiles(droppedFiles);
    });

    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
    });

    function handleFiles(newFiles) {
        files.push(...newFiles);
        updateFileList();
        updatePreview();
    }

    function updateFileList() {
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-image"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <div class="file-actions">
                    <button onclick="moveFile(${index}, -1)"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="moveFile(${index}, 1)"><i class="fas fa-arrow-down"></i></button>
                    <button onclick="removeFile(${index})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    }

    function updatePreview() {
        previewContainer.innerHTML = '';
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="preview-overlay">
                        <div class="preview-actions">
                            <button onclick="previewImage(${index})"><i class="fas fa-eye"></i></button>
                            <button onclick="cropImage(${index})"><i class="fas fa-crop"></i></button>
                            <button onclick="rotateImage(${index})"><i class="fas fa-rotate"></i></button>
                        </div>
                    </div>
                `;
                previewContainer.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    }

    // Preview functions
    window.previewImage = function(index) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${URL.createObjectURL(files[index])}" style="max-width: 100%; height: auto;">
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    };

    window.cropImage = function(index) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 800px;">
                <button class="modal-close">&times;</button>
                <div style="max-height: 70vh; margin: 1rem 0;">
                    <img src="${URL.createObjectURL(files[index])}" style="max-width: 100%;">
                </div>
                <button class="btn btn-primary" id="cropConfirm">Apply Crop</button>
            </div>
        `;
        document.body.appendChild(modal);

        const image = modal.querySelector('img');
        const cropper = new Cropper(image, {
            aspectRatio: NaN,
            viewMode: 1
        });

        modal.querySelector('#cropConfirm').onclick = () => {
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob(blob => {
                const croppedFile = new File([blob], files[index].name, { type: files[index].type });
                files[index] = croppedFile;
                updatePreview();
                modal.remove();
            });
        };

        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    };

    window.rotateImage = function(index) {
        const img = new Image();
        img.src = URL.createObjectURL(files[index]);
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.height;
            canvas.height = img.width;
            
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(Math.PI/2);
            ctx.drawImage(img, -img.width/2, -img.height/2);
            
            canvas.toBlob(blob => {
                const rotatedFile = new File([blob], files[index].name, { type: files[index].type });
                files[index] = rotatedFile;
                updatePreview();
            });
        };
    };

    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Make these functions globally available
    window.moveFile = function(index, direction) {
        if ((index + direction) >= 0 && (index + direction) < files.length) {
            const temp = files[index];
            files[index] = files[index + direction];
            files[index + direction] = temp;
            updateFileList();
            updatePreview();
        }
    };

    window.removeFile = function(index) {
        files.splice(index, 1);
        updateFileList();
        updatePreview();
    };

    // Settings panel handlers
    document.getElementById('pageSize').addEventListener('change', function(e) {
        const customSizeRow = document.getElementById('customSizeRow');
        customSizeRow.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    });

    // Convert button handler
    convertBtn.addEventListener('click', async function() {
        if (files.length === 0) {
            showError('Please add at least one image');
            return;
        }

        try {
            loading.style.display = 'block';
            
            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: document.getElementById('orientation').value,
                unit: 'mm',
                format: document.getElementById('pageSize').value
            });

            // Process each image
            for (let i = 0; i < files.length; i++) {
                if (i > 0) doc.addPage();

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = parseFloat(document.getElementById('margin').value) || 10;
                const usableWidth = pageWidth - (2 * margin);
                const usableHeight = pageHeight - (2 * margin);

                // Add image with proper positioning
                const img = await createImageElement(files[i]);
                const imgProps = doc.getImageProperties(img);
                let imgWidth = usableWidth;
                let imgHeight = (imgProps.height * usableWidth) / imgProps.width;

                if (imgHeight > usableHeight) {
                    imgHeight = usableHeight;
                    imgWidth = (imgProps.width * usableHeight) / imgProps.height;
                }

                const x = margin + (usableWidth - imgWidth) / 2;
                const y = margin;

                doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);

                // Add image name if enabled
                if (document.getElementById('addImageNames').checked) {
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);
                    const fileName = files[i].name;
                    doc.text(fileName, margin, pageHeight - margin/2);
                }

                // Add page numbers if enabled
                if (document.getElementById('addPageNumbers').checked) {
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);
                    const pageText = `Page ${i + 1} of ${files.length}`;
                    doc.text(pageText, pageWidth - margin, pageHeight - margin/2, {
                        align: 'right'
                    });
                }
            }

            // Save PDF with timestamp
            const timestamp = new Date().toISOString().slice(0,10);
            doc.save(`converted-images-${timestamp}.pdf`);
            showSuccess();

        } catch (error) {
            console.error('PDF conversion error:', error);
            showError('PDF conversion failed. Please try again.');
        } finally {
            loading.style.display = 'none';
        }
    });

    // Helper function to create image element from file
    function createImageElement(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Reset button handler
    resetBtn.addEventListener('click', function() {
        files = [];
        updateFileList();
        updatePreview();
        fileInput.value = '';
    });

    function showSuccess() {
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    function showError(message) {
        document.getElementById('errorText').textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    // Mobile menu handler
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    mobileMenuBtn.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });
});
