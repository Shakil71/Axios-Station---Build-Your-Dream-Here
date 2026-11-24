"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState } from "react";
import { Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";
import { MediaPickerDialog } from "./media-picker";
import { cn } from "@/lib/utils";

/** TipTap rich-text editor. Output HTML is sanitised again on the server before storage. */
export function RichTextEditor({ name, initial }: { name: string; initial: string }) {
  const [html, setHtml] = useState(initial);
  const [picker, setPicker] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }), Link.configure({ openOnClick: false, autolink: true }), Image],
    content: initial,
    editorProps: { attributes: { class: "prose-axs min-h-[280px] px-4 py-3 focus:outline-none" } },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const btn = (active: boolean, onClick: () => void, Icon: typeof Bold, label: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg cursor-pointer", active && "bg-brand/15 text-fg")}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://… or /path). Leave empty to remove.", prev ?? "");
    if (url === null) return;
    if (!url) editor.chain().focus().unsetLink().run();
    else if (/^(https?:\/\/|\/|mailto:)/i.test(url)) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-strong bg-bg-2/70 focus-within:border-brand">
      <input type="hidden" name={name} value={html} />
      {editor && (
        <div className="flex flex-wrap gap-0.5 border-b border-border p-1.5">
          {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, "Heading 2")}
          {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3, "Heading 3")}
          {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), Bold, "Bold")}
          {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), Italic, "Italic")}
          {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), Strikethrough, "Strikethrough")}
          {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), List, "Bullet list")}
          {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), ListOrdered, "Numbered list")}
          {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), Quote, "Quote")}
          {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), Code, "Code block")}
          {btn(editor.isActive("link"), setLink, Link2, "Link")}
          {btn(false, () => setPicker(true), ImagePlus, "Insert image")}
          {btn(false, () => editor.chain().focus().setHorizontalRule().run(), Minus, "Divider")}
          <span className="mx-1 w-px bg-border" />
          {btn(false, () => editor.chain().focus().undo().run(), Undo2, "Undo")}
          {btn(false, () => editor.chain().focus().redo().run(), Redo2, "Redo")}
        </div>
      )}
      <EditorContent editor={editor} />
      <MediaPickerDialog
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(m) => {
          editor?.chain().focus().setImage({ src: m.url, alt: m.altText ?? "" }).run();
        }}
      />
    </div>
  );
}
