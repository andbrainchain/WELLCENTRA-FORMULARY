"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadIcon, CheckCircleIcon } from "lucide-react"

interface FileUploaderProps {
  label: string
  icon: React.ReactNode
  onFileSelected: (file: File) => void
  fileName?: string
  accept?: string
}

export default function FileUploader({
  label,
  icon,
  onFileSelected,
  fileName,
  accept = ".xlsx,.xls,.csv",
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelected(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileSelected(files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card
      className={`${isDragging ? "border-primary" : ""} ${fileName ? "border-green-500" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </CardTitle>
        <CardDescription>Upload an Excel or CSV file</CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"}
            ${fileName ? "border-green-500/50 bg-green-500/10" : ""}
          `}
          onClick={triggerFileInput}
        >
          {fileName ? (
            <div className="flex flex-col items-center">
              <CheckCircleIcon className="h-10 w-10 text-green-500 mb-2" />
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drag & drop or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Supports Excel and CSV files</p>
            </div>
          )}

          <input type="file" ref={fileInputRef} className="hidden" accept={accept} onChange={handleFileChange} />
        </div>
      </CardContent>
    </Card>
  )
}
