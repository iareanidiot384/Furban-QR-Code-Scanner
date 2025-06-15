// Check for dark mode preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
    document.getElementById('themeIcon').textContent = '☀️';
}

// Listen for changes to color scheme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
        document.getElementById('themeIcon').textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('themeIcon').textContent = '🌙';
    }
});

// Toggle theme button
document.getElementById('toggleTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
});

// Caesar cipher decryption function
function caesarDecrypt(text, shift = 3) {
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        // Handle uppercase letters
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 + (26 - shift)) % 26) + 65);
        }
        // Handle lowercase letters
        else if (code >= 97 && code <= 122) {
            return String.fromCharCode(((code - 97 + (26 - shift)) % 26) + 97);
        }
        // Return unchanged for non-alphabetic characters
        return char;
    }).join('');
}

// XOR stream cipher decryption (base64 input, key string)
function streamCipherDecrypt(b64Text, key) {
    let bytes = atob(b64Text);
    let result = [];
    for (let i = 0; i < bytes.length; i++) {
        let keyChar = key.charCodeAt(i % key.length);
        result.push(String.fromCharCode(bytes.charCodeAt(i) ^ keyChar));
    }
    return result.join('');
}

// Load key.txt from server
async function loadKeyFromFile() {
    const response = await fetch('key.txt');
    if (!response.ok) throw new Error('Failed to load key.txt');
    return response.text();
}

// Main decryption: base64 → XOR → Caesar → JSON
async function decryptBookingData(encryptedData, shift = 3) {
    try {
        const key = await loadKeyFromFile();
        const caesar = streamCipherDecrypt(encryptedData, key.trim());
        const decrypted = caesarDecrypt(caesar, shift);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Error decrypting data:', error);
        throw new Error('Unable to decrypt QR code data. This may not be a valid booking QR code.');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => {
        document.body.removeChild(toast);
    });
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

// Show scan success indicator
function showScanSuccess() {
    const container = document.getElementById('camera-container');
    const indicator = document.createElement('div');
    indicator.className = 'scan-indicator';
    container.appendChild(indicator);
    setTimeout(() => {
        if (container.contains(indicator)) {
            container.removeChild(indicator);
        }
    }, 1000);
}

// Function to display booking information
function displayBookingInfo(booking) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('result-enter');
    document.getElementById('scanner-section').classList.add('hidden');
    let dishesHtml = '';
    if (booking.dishes && Array.isArray(booking.dishes)) {
        dishesHtml = '<div class="mt-2">';
        booking.dishes.forEach(dish => {
            dishesHtml += `<div class="ml-4 flex justify-between"><span>• ${dish.name}</span> <span class="font-medium">${dish.quantity}</span></div>`;
        });
        dishesHtml += '</div>';
    } else if (booking.selectedDish) {
        dishesHtml = `<div class="mt-2"><div class="ml-4 flex justify-between"><span>• ${booking.selectedDish}</span> <span class="font-medium">${booking.dishQuantity}</span></div></div>`;
    }
    const bookingInfo = document.getElementById('bookingInfo');
    bookingInfo.innerHTML = `
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div class="space-y-3">
                <div class="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                    <span class="font-medium">Customer:</span>
                    <span>${booking.customerName}</span>
                </div>
                <div class="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                    <span class="font-medium">Contact:</span>
                    <span>${booking.contactMedium}: ${booking.username}</span>
                </div>
                <div class="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                    <span class="font-medium">Timeslot:</span>
                    <span>${booking.timeslot}</span>
                </div>
                <div class="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                    <span class="font-medium">Seat:</span>
                    <span>${booking.seatNumber}</span>
                </div>
                <div>
                    <div class="font-medium border-b border-gray-200 dark:border-gray-600 pb-2">Selected Dishes:</div>
                    ${dishesHtml}
                </div>
            </div>
        </div>
    `;
}

// Function to show error
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    errorContainer.classList.remove('hidden');
    errorMessage.textContent = message;
    document.getElementById('scanner-section').classList.add('hidden');
}

// Function to play success sound
function beepSuccess() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, 150);
    } catch (error) {
        console.log('Audio not supported');
    }
}

// Tab switching logic - Mobile
document.getElementById('mobileTabCamera').addEventListener('click', () => {
    showTab('cameraScanner');
    updateActiveMobileTab('mobileTabCamera');
});

document.getElementById('mobileTabFile').addEventListener('click', () => {
    showTab('fileScanner');
    updateActiveMobileTab('mobileTabFile');
    stopCamera();
});

document.getElementById('mobileTabManual').addEventListener('click', () => {
    showTab('manualInput');
    updateActiveMobileTab('mobileTabManual');
    stopCamera();
});

function updateActiveMobileTab(activeTabId) {
    document.querySelectorAll('.mobile-tab-bar button').forEach(tab => {
        tab.classList.remove('text-primary', 'border-t-2', 'border-primary');
        tab.classList.add('text-gray-500', 'dark:text-gray-400');
    });
    document.getElementById(activeTabId).classList.remove('text-gray-500', 'dark:text-gray-400');
    document.getElementById(activeTabId).classList.add('text-primary', 'border-t-2', 'border-primary');
}

function showTab(tabId) {
    document.getElementById('errorContainer').classList.add('hidden');
    document.getElementById('resultContainer').classList.add('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');
    document.querySelectorAll('.scanner-tab').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'cameraScanner' && video.srcObject) {
        resumeScanning();
    }
}

// Camera handling
let video = document.getElementById('camera-view');
let canvas = document.getElementById('camera-canvas');
let context = canvas.getContext('2d');
let scanInterval;
let mediaStream = null;
let isScanning = false;

// Start Camera button
document.getElementById('startCameraBtn').addEventListener('click', startCamera);

// Manual scan button
document.getElementById('scanBtn').addEventListener('click', () => scanQRCode());

// Show scanning indicator
function updateScanningStatus(isActive) {
    const indicator = document.getElementById('scanning-indicator');
    if (isActive) {
        indicator.classList.remove('hidden');
        isScanning = true;
    } else {
        indicator.classList.add('hidden');
        isScanning = false;
    }
}

// Resume scanning (used when returning to scanner)
function resumeScanning() {
    if (!scanInterval && video.srcObject) {
        updateScanningStatus(true);
        scanInterval = setInterval(scanQRCode, 500);
        document.getElementById('scanBtn').disabled = false;
        console.log("Scanning resumed automatically");
    }
}

// Start the camera
function startCamera() {
    const startBtn = document.getElementById('startCameraBtn');
    const scanBtn = document.getElementById('scanBtn');
    const statusMsg = document.getElementById('camera-status');
    startBtn.disabled = true;
    startBtn.innerHTML = '<div class="loading-spinner"></div> Starting camera...';
    statusMsg.classList.remove('hidden');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        })
        .then(function(stream) {
            mediaStream = stream;
            video.srcObject = stream;
            video.onloadedmetadata = function() {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                startBtn.innerHTML = 'Restart Camera';
                startBtn.disabled = false;
                scanBtn.disabled = false;
                statusMsg.classList.add('hidden');
                updateScanningStatus(true);
                scanInterval = setInterval(scanQRCode, 500);
            };
            return video.play();
        })
        .catch(function(error) {
            console.error('Camera access error:', error);
            startBtn.innerHTML = 'Start Camera';
            startBtn.disabled = false;
            statusMsg.innerHTML = `
                <p>❗ Camera access denied or error.</p>
                <p class="mt-1">Try using the Image or Manual input options instead.</p>
            `;
            showToast("Camera access error. Try the Image or Manual tab instead.", "error");
        });
    } else {
        statusMsg.innerHTML = `
            <p>❗ Camera not supported in this browser.</p>
            <p class="mt-1">Try using the Image or Manual input options instead.</p>
        `;
        startBtn.innerHTML = 'Camera Unavailable';
        startBtn.disabled = true;
        showToast("Camera not supported. Try the Image or Manual tab instead.", "error");
    }
}

// Stop the camera
function stopCamera() {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
        updateScanningStatus(false);
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        video.srcObject = null;
    }
    const startBtn = document.getElementById('startCameraBtn');
    const scanBtn = document.getElementById('scanBtn');
    startBtn.innerHTML = 'Start Camera';
    startBtn.disabled = false;
    scanBtn.disabled = true;
}

// Scan for QR codes (now async)
async function scanQRCode() {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    if (code) {
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
            updateScanningStatus(false);
        }
        showScanSuccess();
        showToast("QR Code successfully scanned!");
        beepSuccess();
        try {
            const bookingData = await decryptBookingData(code.data, 3);
            setTimeout(() => {
                displayBookingInfo(bookingData);
            }, 500);
        } catch (error) {
            showError(error.message || "Failed to process QR code data");
            if (!scanInterval) {
                scanInterval = setInterval(scanQRCode, 500);
                updateScanningStatus(true);
            }
        }
    }
}

// File input handling (now async)
document.getElementById('qrFileInput').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const img = new Image();
        img.onload = async function() {
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempContext.drawImage(img, 0, 0, img.width, img.height);
            const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
            if (code) {
                showToast("QR Code successfully scanned from image!");
                beepSuccess();
                try {
                    const bookingData = await decryptBookingData(code.data, 3);
                    setTimeout(() => {
                        displayBookingInfo(bookingData);
                    }, 500);
                } catch (error) {
                    showError(error.message || "Failed to process QR code data");
                }
            } else {
                showError("No QR code found in the image. Please try with a clearer image.");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Manual input handling (now async)
document.getElementById('decodeManualBtn').addEventListener('click', async () => {
    const qrData = document.getElementById('qrDataInput').value.trim();
    if (!qrData) {
        showError("Please enter QR code data.");
        return;
    }
    try {
        const bookingData = await decryptBookingData(qrData, 3);
        showToast("QR Code data successfully decoded!");
        beepSuccess();
        setTimeout(() => {
            displayBookingInfo(bookingData);
        }, 500);
    } catch (error) {
        showError(error.message);
    }
});

// Button to return to scanner - automatically resume scanning
document.getElementById('backToScannerBtn').addEventListener('click', () => {
    document.getElementById('resultContainer').classList.add('hidden');
    document.getElementById('resultContainer').classList.remove('result-enter');
    document.getElementById('scanner-section').classList.remove('hidden');
    showTab('cameraScanner');
    if (video.srcObject) {
        resumeScanning();
        showToast("Scanning resumed");
    }
});

// Dismiss error button - automatically resume scanning //
document.getElementById('dismissErrorBtn').addEventListener('click', () => {
    document.getElementById('errorContainer').classList.add('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');
    showTab('cameraScanner');
    if (video.srcObject) {
        resumeScanning();
    }
});