import { useEffect, useRef, useState } from "react";
import { resolveProductImage } from "../utils/productImage.js";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

export default function ProductImageUpload({ value, file, onChange }) {
  const inputRef = useRef(null);
  const previewUrlRef = useRef("");
  const [filePreview, setFilePreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      if (inputRef.current) inputRef.current.value = "";
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, [file]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const handleChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setError("");

    if (selectedFile && !acceptedTypes.has(selectedFile.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      onChange(null);
      return;
    }

    if (selectedFile && selectedFile.size > maxFileSize) {
      setError("The image must be 5 MB or smaller.");
      event.target.value = "";
      onChange(null);
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = selectedFile ? URL.createObjectURL(selectedFile) : "";
    setFilePreview(previewUrlRef.current);
    onChange(selectedFile);
  };

  const preview = file ? filePreview : resolveProductImage(value);

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm font-semibold text-zinc-700">
        Product image
        <input
          ref={inputRef}
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          aria-describedby={error ? "product-image-error" : undefined}
        />
      </label>
      {error && (
        <p id="product-image-error" role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {preview ? (
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">
          <img src={preview} alt="Product image preview" className="h-full w-full object-contain" />
        </div>
      ) : (
        <p className="text-xs text-zinc-500">JPEG, PNG, or WebP up to 5 MB.</p>
      )}
    </div>
  );
}