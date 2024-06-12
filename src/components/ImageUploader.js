import React, { useState, useCallback } from 'react';
import Dropzone from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCrop, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import './ImageUploader.css';

const ImageUploader = () => {
    const [images, setImages] = useState([]);
    const [selectedImageIndexes, setSelectedImageIndexes] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [crop, setCrop] = useState({ aspect: 1 });
    const [croppedImageUrl, setCroppedImageUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [error, setError] = useState('');

    const handleDrop = (acceptedFiles) => {
        const newImages = acceptedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            status: 'pending',
        }));

        // Check if adding new images exceeds the limit of 5
        if (images.length + newImages.length > 5) {
            setError('You can only upload up to 5 images.');
            return;
        }

        setImages([...images, ...newImages]);
    };

    const handleSelectImage = (index) => {
        if (selectedImageIndexes.length >= 5 && !selectedImageIndexes.includes(index)) {
            setError('You have reached the limit of 5 images.');
            return;
        }

        const selectedIndex = selectedImageIndexes.indexOf(index);
        if (selectedIndex === -1) {
            setSelectedImageIndexes([...selectedImageIndexes, index]);
        } else {
            const updatedIndexes = [...selectedImageIndexes];
            updatedIndexes.splice(selectedIndex, 1);
            setSelectedImageIndexes(updatedIndexes);
        }
        setError('');
    };

    const handleDeleteImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
        const updatedIndexes = selectedImageIndexes.filter(idx => idx !== index);
        setSelectedImageIndexes(updatedIndexes);
    };

    const handleCropComplete = useCallback((crop) => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const image = new Image();
                image.src = reader.result;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = crop.width;
                canvas.height = crop.height;
                ctx.drawImage(
                    image,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    crop.width,
                    crop.height
                );
                canvas.toBlob(blob => {
                    const fileUrl = URL.createObjectURL(blob);
                    setCroppedImageUrl(fileUrl);
                });
            };
            reader.readAsDataURL(selectedFile);
        }
    }, [selectedFile]);

    const handleUpload = () => {
        selectedImageIndexes.forEach(index => {
            const image = images[index];
            const formData = new FormData();
            formData.append('image', image.file);

            axios.post('/api/upload', formData, {
                onUploadProgress: progressEvent => {
                    setUploadProgress(prevProgress => ({
                        ...prevProgress,
                        [index]: (progressEvent.loaded / progressEvent.total) * 100
                    }));
                }
            })
            .then(response => {
                setUploadProgress(prevProgress => ({
                    ...prevProgress,
                    [index]: 100
                }));
                setImages(prevImages => prevImages.map((img, i) => i === index ? { ...img, status: 'uploaded' } : img));
            })
            .catch(error => {
                setError('Upload failed. Please try again.');
            });
        });
    };

    const handleUnselectAll = () => {
        setSelectedImageIndexes([]);
    };

    return (
        <div className="image-uploader">
            <h2>Upload image(s)</h2>
            <p className='outside-drop'>You may upload up to 5 images</p>
            <Dropzone onDrop={handleDrop} accept="image/jpeg, image/png" multiple maxSize={5242880}>
                {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps({ className: 'dropzone' })}>
                        <input {...getInputProps()} />
                        <FontAwesomeIcon icon={faCloudUploadAlt} className="upload-icon" />
                        <p className='inside-drop'>Click or drag and drop to upload</p>
                        <p className='inside-text'>PNG, or JPG (Max 5MB)</p>
                    </div>
                )}
            </Dropzone>
            <div className='image-detail'>
            {error && <div className="error">{error}</div>}
            <div className="uploaded-images">
            
                {images.length > 0 && images.map((image, index) => (
                    <div key={index} className="image-item">
                    <span className="image-selection">
                            <input
                                type="radio"
                                checked={selectedImageIndexes.includes(index)}
                                onChange={() => handleSelectImage(index)}
                            />
                        </span>
                        <div className="image-preview">
                            <img
                                src={image.preview}
                                alt={`uploaded-${index}`}
                                className={selectedImageIndexes.includes(index) ? 'selected' : ''}
                            />
                        </div>
                        <div className="image-details">
                            <p>{image.file.name}</p>
                            <p>{(image.file.size/(1024*1024) ).toFixed(2)} MB</p>
                        </div>
                        <div className="image-actions">
                            <button className='trash' onClick={() => handleDeleteImage(index)}>
                                <FontAwesomeIcon icon={faTrash} /> Delete
                            </button>
                            <button className='trash' onClick={() => handleSelectImage(index)}>
                                <FontAwesomeIcon icon={faCrop} /> Crop
                            </button>
                        </div>
                        
                        {uploadProgress[index] !== undefined && (
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${uploadProgress[index]}%` }}
                                />
                            </div>
                        )}
                        {image.status === 'uploaded' && <p className="upload-success">Upload success!</p>}
                    </div>
                ))}
            </div>
            {selectedFile && (
                <div className="crop-container">
                    <ReactCrop
                        src={URL.createObjectURL(selectedFile)}
                        crop={crop}
                        onChange={setCrop}
                        onComplete={handleCropComplete}
                    />
                    {croppedImageUrl && <img src={croppedImageUrl} alt="Cropped" />}
                </div>
            )}
            {images.length > 0 && (
                <div className="actions">
                    <button className="cancel-button" onClick={handleUnselectAll}>Cancel</button>
                    <button onClick={handleUpload} disabled={selectedImageIndexes.length === 0}>Select image</button>
                </div>
            )}
            </div>
        </div>
    );
};

export default ImageUploader;
