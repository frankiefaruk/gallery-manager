class GalleryManager {
  constructor() {
    this.images = [];
    this.intersectionObserver = null;
    this.currentImageIndex = -1;
    this.initializeElements();
    this.bindEvents();
    this.setupIntersectionObserver();
    this.setupTitleRename();
    this.loadTheme();
    this.loadInitialImages();
    this.setupProgressBar();
  }

  initializeElements() {
    this.galleryTitle = document.getElementById('galleryTitle');
    this.saveStateBtn = document.getElementById('saveState');
    this.uploadImagesBtn = document.getElementById('uploadImages');
    this.imageUploadInput = document.getElementById('imageUpload');
    this.gallery = document.getElementById('gallery');
    this.modal = document.getElementById('imageModal');
    this.modalImg = document.getElementById('modalImage');
    this.themeToggleBtn = document.getElementById('themeToggle');
    this.convertToWebpBtn = document.getElementById('convertToWebp');
    this.resetButton = document.getElementById('resetButton');
    this.resizeDropdown = document.querySelector('.dropdown-content');
    this.resizeButton = document.getElementById('resizeButton'); 
  }

  bindEvents() {
    if (this.saveStateBtn) {
      this.saveStateBtn.addEventListener('click', () => this.saveState());
    }
    if (this.uploadImagesBtn && this.imageUploadInput) {
      this.uploadImagesBtn.addEventListener('click', () => this.imageUploadInput.click());
      this.imageUploadInput.addEventListener('change', (e) => this.handleImageUpload(e));
    }
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    if (this.convertToWebpBtn) {
      this.convertToWebpBtn.addEventListener('click', () => this.convertToWebp());
    }
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => this.resetGallery());
    }
    if (this.resizeButton) {
      this.resizeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleResizeDropdown();
      });
    }
    if (this.resizeDropdown) {
      this.resizeDropdown.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          e.preventDefault();
          const percentage = parseInt(e.target.dataset.size);
          this.resizeAllImages(percentage);
          this.resizeDropdown.classList.remove('show'); 
        }
      });
    }
    document.addEventListener('click', (e) => {
      if (this.resizeDropdown && !this.resizeDropdown.contains(e.target) && e.target !== this.resizeButton) {
        this.resizeDropdown.classList.remove('show');
      }
    });
  }

  toggleResizeDropdown() {
    if (this.resizeDropdown) {
      this.resizeDropdown.classList.toggle('show');
    }
  }

  openModal(imageUrl) {
    this.modalImg.src = imageUrl;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.currentImageIndex = this.images.findIndex(imgData => imgData.url === imageUrl);
    document.addEventListener('keydown', this.handleModalNavigation);
  }

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleModalNavigation);
    this.currentImageIndex = -1;
  }

  handleModalNavigation = (event) => {
    if (this.modal.classList.contains('active')) {
      if (event.key === 'ArrowRight') {
        this.navigateToNextImage();
      } else if (event.key === 'ArrowLeft') {
        this.navigateToPreviousImage();
      }
    }
  }

  navigateToNextImage() {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
      this.modalImg.src = this.images[this.currentImageIndex].url;
    }
  }

  navigateToPreviousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.modalImg.src = this.images[this.currentImageIndex].url;
    }
  }

  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const galleryItem = entry.target;
            galleryItem.classList.add('visible');
            this.intersectionObserver.unobserve(galleryItem);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  async getImageOrientation(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const orientation = img.width >= img.height ? 'landscape' : 'portrait';
        resolve({ url: imageUrl, orientation, width: img.width, height: img.height });
      };
      img.src = imageUrl;
    });
  }

  async handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const imagePromises = files.map(async (file) => {
      try {
        const imageUrl = await this.readFileAsDataURL(file);
        const imageData = await this.getImageOrientation(imageUrl);
        return imageData;
      } catch (error) {
        console.error('Error processing image:', error);
        return null;
      }
    });

    const processedImages = (await Promise.all(imagePromises)).filter(img => img !== null);
    const sortedImages = processedImages.sort((a, b) => {
      if (a.orientation === b.orientation) {
        const aRatio = a.width / a.height;
        const bRatio = b.width / b.height;
        return bRatio - aRatio;
      }
      return a.orientation === 'landscape' ? -1 : 1;
    });

    this.images = [...this.images, ...sortedImages];
    this.updateGallery();
    event.target.value = '';
  }

  createGalleryItem(imageData, index) {
    const galleryItem = document.createElement('div');
    galleryItem.className = `gallery-item ${imageData.orientation}`;

    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = `Image ${index + 1}`;
    img.loading = 'lazy';
    img.addEventListener('click', () => this.openModal(imageData.url));

    galleryItem.appendChild(img);

    galleryItem.classList.add('fade-in');
    this.intersectionObserver.observe(galleryItem);

    return galleryItem;
  }

  updateGallery() {
    this.gallery.innerHTML = '';
    this.images.forEach((imageData, index) => {
      const galleryItem = this.createGalleryItem(imageData, index);
      this.gallery.appendChild(galleryItem);
    });
  }

  async readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async saveState() {
    try {
      const zip = new JSZip();

      const currentTitle = this.galleryTitle.textContent.trim();
      const now = new Date();
      const formattedDate = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
      const formattedTime = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      const filename = `${currentTitle}-${formattedDate}-${formattedTime}`;

      const root = zip.folder(filename);
      const cssFolder = root.folder("css");
      const jsFolder = root.folder("js");
      const imgFolder = root.folder("img");

      const cssResponse = await fetch('css/styles.css');
      const cssContent = await cssResponse.text();
      cssFolder.file('styles.css', cssContent);

      const jsResponse = await fetch('js/script.js');
      const jsContent = await jsResponse.text();
      jsFolder.file('script.js', jsContent);

      const imagePromises = this.images.map(async (imageData, index) => {
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        const extension = this.getImageExtension(blob.type);
        const filename = `image${index + 1}${extension}`;
        imgFolder.file(filename, blob);
        return filename;
      });
      const imageFilenames = await Promise.all(imagePromises);

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentTitle}</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header>
    <h1 id="galleryTitle">${currentTitle}</h1>
  </header>

  <main>
    <div id="gallery" class="gallery"></div>
  </main>

  <div id="imageModal" class="modal">
    <img id="modalImage" src="" alt="Enlarged image">
  </div>

  <script>
    window.initialState = {
      images: [
        ${this.images.map((img, index) => `{
          url: 'img/${imageFilenames[index]}',
          orientation: '${img.orientation}',
          width: ${img.width},
          height: ${img.height}
        }`).join(',\n        ')}
      ]
    };
  </script>
  <script src="js/script.js"></script>
</body>
</html>`;

      root.file('index.html', htmlContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = `${filename}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  getImageExtension(mimeType) {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    return extensions[mimeType] || '.jpg';
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme'); 
    }
  }

  loadInitialImages() {
    this.loadTheme();
    if (window.initialState && window.initialState.images) {
      this.images = window.initialState.images;
      this.updateGallery();
    }
  }

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLightTheme = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
  }

  setupTitleRename() {
    if (this.galleryTitle) {
      this.galleryTitle.addEventListener('dblclick', () => {
        const newTitle = prompt('Enter new gallery title:', this.galleryTitle.textContent);
        if (newTitle) {
          this.galleryTitle.textContent = newTitle;
          document.title = newTitle;
        }
      });
    }
  }

  setupProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    this.progressElements = {
      container: progressContainer,
      bar: progressBar
    };
  }

  updateProgress(progress, operation) {
    const { container, bar } = this.progressElements;
    
    if (progress === 0) {
      container.classList.add('active');
    }

    bar.style.width = `${progress}%`;

    if (progress >= 100) {
      setTimeout(() => {
        container.classList.remove('active');
        bar.style.width = '0';
      }, 500);
    }
  }

  async convertToWebp() {
    if (this.images.length === 0) {
      return;
    }

    const webpImages = [];
    this.updateProgress(0, 'Converting to WebP');

    for (let i = 0; i < this.images.length; i++) {
      try {
        const webpUrl = await this.convertToWebpDataUrl(this.images[i].url);
        const webpData = await this.getImageOrientation(webpUrl);
        webpImages.push(webpData);
        
        const progress = ((i + 1) / this.images.length) * 100;
        this.updateProgress(progress, 'Converting to WebP');
      } catch (error) {
        console.error('Error converting to WebP:', error);
        this.updateProgress(100, 'Error');
        return;
      }
    }

    this.images = webpImages;
    this.updateGallery();
  }

  async convertToWebpDataUrl(imageUrl) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const base64data = reader.result;
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async (webpBlob) => { 
              if (!webpBlob) {
                reject('Failed to convert to WebP');
                return;
              }
              const webpReader = new FileReader();
              webpReader.onloadend = () => {
                resolve(webpReader.result); 
              };
              webpReader.onerror = reject;
              webpReader.readAsDataURL(webpBlob);
            }, 'image/webp'); 
          };
          img.onerror = reject;
          img.src = base64data;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  async resizeImage(imageUrl, percentage) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const newWidth = img.width * (percentage / 100);
        const newHeight = img.height * (percentage / 100);
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve({
            url,
            width: newWidth,
            height: newHeight,
            orientation: newWidth >= newHeight ? 'landscape' : 'portrait'
          });
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async resizeAllImages(percentage) {
    if (this.images.length === 0) {
      return;
    }

    try {
      const resizedImages = [];
      this.updateProgress(0, 'Resizing Images');

      for (let i = 0; i < this.images.length; i++) {
        const resizedImage = await this.resizeImage(this.images[i].url, percentage);
        resizedImages.push(resizedImage);
        
        const progress = ((i + 1) / this.images.length) * 100;
        this.updateProgress(progress, 'Resizing Images');

        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach(item => {
          if (item.querySelector('img').src === this.images[i].url) {
            item.classList.add('resizing');
            setTimeout(() => item.classList.remove('resizing'), 300);
          }
        });
      }
      
      this.images = resizedImages;
      this.updateGallery();
    } catch (error) {
      console.error('Error resizing images:', error);
      this.updateProgress(100, 'Error');
    }
  }

  resetGallery() {
    this.images = [];
    this.updateGallery();
    this.galleryTitle.textContent = 'Gallery Manager';
    document.title = 'Gallery Manager';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.galleryManager = new GalleryManager();
});