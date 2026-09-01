"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Minus,
} from "lucide-react";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = 200,
}: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-emerald-600 underline" },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "rounded-lg max-w-full h-auto" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${minHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. when loading a different item)
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="border rounded-lg bg-gray-50 animate-pulse"
        style={{ minHeight: minHeight + 40 }}
      />
    );
  }

  const toolbarBtn = (onClick: () => void, active: boolean, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? "bg-emerald-100 text-emerald-700" : "text-gray-600 hover:bg-gray-100"
      }`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 px-2 py-1.5">
        {toolbarBtn(() => editor.chain().focus().undo().run(), false, <Undo className="h-4 w-4" />, "Undo")}
        {toolbarBtn(() => editor.chain().focus().redo().run(), false, <Redo className="h-4 w-4" />, "Redo")}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toolbarBtn(() => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), <Bold className="h-4 w-4" />, "Bold")}
        {toolbarBtn(() => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), <Italic className="h-4 w-4" />, "Italic")}
        {toolbarBtn(() => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), <Strikethrough className="h-4 w-4" />, "Strikethrough")}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toolbarBtn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }), <Heading1 className="h-4 w-4" />, "Heading 1")}
        {toolbarBtn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), <Heading2 className="h-4 w-4" />, "Heading 2")}
        {toolbarBtn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }), <Heading3 className="h-4 w-4" />, "Heading 3")}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toolbarBtn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), <List className="h-4 w-4" />, "Bullet list")}
        {toolbarBtn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), <ListOrdered className="h-4 w-4" />, "Ordered list")}
        {toolbarBtn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"), <Quote className="h-4 w-4" />, "Quote")}
        {toolbarBtn(() => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"), <Code className="h-4 w-4" />, "Code block")}
        {toolbarBtn(() => editor.chain().focus().setHorizontalRule().run(), false, <Minus className="h-4 w-4" />, "Horizontal rule")}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toolbarBtn(addLink, editor.isActive("link"), <LinkIcon className="h-4 w-4" />, "Add link")}
        {toolbarBtn(addImage, false, <ImageIcon className="h-4 w-4" />, "Add image")}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toolbarBtn(() => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }), <AlignLeft className="h-4 w-4" />, "Align left")}
        {toolbarBtn(() => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), <AlignCenter className="h-4 w-4" />, "Align center")}
        {toolbarBtn(() => editor.chain().focus().setTextAlign("right").run(), editor.isActive({ textAlign: "right" }), <AlignRight className="h-4 w-4" />, "Align right")}
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
      {/* Placeholder hint */}
      {!value && (
        <div className="px-4 pb-2 -mt-8 text-gray-400 text-sm pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
