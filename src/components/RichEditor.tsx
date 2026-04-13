import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Underline } from '@tiptap/extension-underline'
import { Youtube } from '@tiptap/extension-youtube'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Redo,
    Strikethrough,
    UnderlineIcon,
    Undo,
    Video,
} from 'lucide-react'

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: false }),
      Youtube.configure({ inline: false, ccLanguage: 'es' }),
      Placeholder.configure({ placeholder: 'Empieza a escribir tu artículo...' }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })

  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('URL de la imagen:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const addYoutube = () => {
    const url = window.prompt('URL del video de YouTube:')
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''} title="Negrita"><Bold size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''} title="Cursiva"><Italic size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''} title="Subrayado"><UnderlineIcon size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'active' : ''} title="Tachado"><Strikethrough size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'active' : ''} title="Resaltar"><Highlighter size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'active' : ''} title="Título 1"><Heading1 size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''} title="Título 2"><Heading2 size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'active' : ''} title="Título 3"><Heading3 size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''} title="Alinear izquierda"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''} title="Centrar"><AlignCenter size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''} title="Alinear derecha"><AlignRight size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''} title="Lista"><List size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''} title="Lista numerada"><ListOrdered size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'active' : ''} title="Cita"><Quote size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'active' : ''} title="Código"><Code size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={addLink} title="Enlace"><LinkIcon size={16} /></button>
          <button type="button" onClick={addImage} title="Imagen"><ImageIcon size={16} /></button>
          <button type="button" onClick={addYoutube} title="Video YouTube"><Video size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer"><Undo size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer"><Redo size={16} /></button>
        </div>
      </div>

      <EditorContent editor={editor} className="editor-content" />
    </div>
  )
}
