import { useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { UploadCloud, X, Plus } from 'lucide-react'
import { useCreateShotMutation } from '../hooks/useShots'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { getErrorMessage } from '../utils/errors'

export const UploadPage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const createMutation = useCreateShotMutation()

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase()
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title || !imageFile) return

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('tags', tags.join(','))
    formData.append('image', imageFile)

    createMutation.mutate(formData)
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-surface-alt border border-border rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-extrabold text-ink mb-2 text-center">Завантажити нову роботу</h1>
        <p className="text-muted text-sm text-center mb-8">Поділіться своїми креативними ідеями зі спільнотою</p>

        {createMutation.isError && (
          <Alert type="error" message={getErrorMessage(createMutation.error)} className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Зона завантаження зображення */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase">Зображення роботи</label>

            {imagePreview ? (
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-4/3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface-alt'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleChange} accept="image/*" className="hidden" />
                <UploadCloud className="w-12 h-12 text-muted mb-4" />
                <p className="text-ink font-medium text-sm mb-1">
                  Перетягніть файл сюди або натисніть для вибору
                </p>
                <p className="text-xs text-muted">Підтримуються формати JPG, PNG, GIF</p>
              </div>
            )}
          </div>

          <Input
            label="Назва роботи"
            placeholder="Введіть креативну назву..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted tracking-wide">Опис роботи</label>
            <textarea
              placeholder="Розкажіть трохи про вашу роботу, деталі концепту..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl bg-surface border border-border px-4 py-3 text-sm text-ink focus:outline-none focus:border-primary min-h-25"
            />
          </div>

          {/* Теги */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase">Теги</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="наприклад: ui, app, branding"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1 rounded-2xl bg-surface border border-border px-4 py-3 text-sm text-ink focus:outline-none focus:border-primary"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-border text-xs text-ink rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" isLoading={createMutation.isPending} disabled={!title || !imageFile} className="w-full mt-4">
            Опублікувати
          </Button>
        </form>
      </div>
    </div>
  )
}
