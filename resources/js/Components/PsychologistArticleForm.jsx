import { Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { FiBold, FiItalic, FiList, FiScissors, FiType, FiUnderline } from '@/lib/icons';

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ');
}

export default function PsychologistArticleForm({
    article = null,
    topics = [],
    submitRoute,
    method = 'post',
    title,
    description,
    submitLabel,
}) {
    const editorRef = useRef(null);
    const editorWrapperRef = useRef(null);
    const toolbarRef = useRef(null);
    const form = useForm({
        title: article?.title ?? '',
        tag: article?.tag ?? '',
        topic_id: article?.topic_id?.toString() ?? topics[0]?.id?.toString() ?? '',
        body: article?.body ?? '',
        hero_image: null,
    });
    const [editorHtml, setEditorHtml] = useState(article?.body ?? '');
    const [imagePreview, setImagePreview] = useState(article?.hero_image ?? null);
    const [localError, setLocalError] = useState(null);
    const [toolbarState, setToolbarState] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        heading: false,
        unorderedList: false,
    });
    const [toolbarFixedStyle, setToolbarFixedStyle] = useState(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    const editorDisabled = topics.length === 0 || form.processing;

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = article?.body ?? '';
        }
    }, [article?.body]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (typeof window === 'undefined') {
                return;
            }

            const selection = window.getSelection();
            if (!selection?.anchorNode || !editorRef.current?.contains(selection.anchorNode)) {
                return;
            }

            const block = document.queryCommandValue('formatBlock')?.toLowerCase();
            setToolbarState({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strike: document.queryCommandState('strikeThrough'),
                heading: block === 'h3',
                unorderedList: document.queryCommandState('insertUnorderedList'),
            });
        };

        document.addEventListener('selectionchange', handleSelectionChange);

        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const resolveHeaderOffset = () => {
            const rootStyles = window.getComputedStyle(document.documentElement);
            const headerVar = Number.parseFloat(rootStyles.getPropertyValue('--header-height')) || 0;
            const siteHeader = document.querySelector('.site-header');
            const headerHeight = siteHeader instanceof HTMLElement ? siteHeader.getBoundingClientRect().height : headerVar;

            return Math.ceil(headerHeight + 16);
        };

        const updateToolbarPosition = () => {
            const wrapper = editorWrapperRef.current;
            const toolbar = toolbarRef.current;

            if (!wrapper || !toolbar) {
                return;
            }

            const headerOffset = resolveHeaderOffset();
            const wrapperRect = wrapper.getBoundingClientRect();
            const toolbarRect = toolbar.getBoundingClientRect();
            const wrapperStyles = window.getComputedStyle(wrapper);
            const paddingLeft = Number.parseFloat(wrapperStyles.paddingLeft) || 0;
            const paddingRight = Number.parseFloat(wrapperStyles.paddingRight) || 0;
            const nextToolbarHeight = Math.ceil(toolbarRect.height);

            if (toolbarHeight !== nextToolbarHeight) {
                setToolbarHeight(nextToolbarHeight);
            }

            const shouldFix = wrapperRect.top <= headerOffset && wrapperRect.bottom - nextToolbarHeight > headerOffset;

            if (!shouldFix) {
                setToolbarFixedStyle(null);
                return;
            }

            setToolbarFixedStyle({
                left: `${wrapperRect.left + paddingLeft}px`,
                width: `${Math.max(0, wrapperRect.width - paddingLeft - paddingRight)}px`,
                top: `${headerOffset}px`,
            });
        };

        const onFrame = () => window.requestAnimationFrame(updateToolbarPosition);

        updateToolbarPosition();
        window.addEventListener('scroll', onFrame, { passive: true });
        window.addEventListener('resize', onFrame);

        return () => {
            window.removeEventListener('scroll', onFrame);
            window.removeEventListener('resize', onFrame);
        };
    }, [toolbarHeight]);

    const applyFormat = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        const html = editorRef.current?.innerHTML ?? '';
        setEditorHtml(html);
        form.setData('body', html);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        form.setData(name, value);
    };

    const handleEditorInput = (event) => {
        const html = event.currentTarget.innerHTML;
        setEditorHtml(html);
        form.setData('body', html);
    };

    const handleEditorPaste = (event) => {
        if (!editorRef.current) {
            return;
        }

        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') ?? '';
        document.execCommand('insertText', false, text);
        const html = editorRef.current.innerHTML;
        setEditorHtml(html);
        form.setData('body', html);
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            form.setData('hero_image', null);
            setImagePreview(article?.hero_image ?? null);
            return;
        }

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setLocalError('Imaginea trebuie sa fie JPG sau PNG.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setLocalError(`Imaginea trebuie sa fie mai mica de ${MAX_FILE_SIZE_MB}MB.`);
            event.target.value = '';
            return;
        }

        setLocalError(null);
        form.setData('hero_image', file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result?.toString() ?? null);
        reader.readAsDataURL(file);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLocalError(null);

        const titleValue = form.data.title.trim();
        const tagValue = form.data.tag.trim();
        const bodyText = stripHtml(editorHtml).trim();

        if (!titleValue || !tagValue || !form.data.topic_id || !bodyText) {
            setLocalError('Completeaza titlul, tag-ul, rubrica si continutul articolului.');
            return;
        }

        if (!article && !form.data.hero_image) {
            setLocalError('Adauga o imagine pentru articol.');
            return;
        }

        form.transform((data) => ({
            ...data,
            title: data.title.trim(),
            tag: data.tag.trim(),
            body: editorHtml,
            topic_id: Number(data.topic_id),
            _method: method,
        }));

        form.post(submitRoute, {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const firstError = localError ?? Object.values(form.errors)[0];

    return (
        <>
            <div className="group-convo-nav">
                <Link href={route('psychologists.dashboard', { section: 'articles' })} className="group-back-link">
                    &larr; Inapoi
                </Link>
            </div>
            <section className="card psych-card">
                <div className="section-title">{title}</div>
                <p className="muted">{description}</p>
                {topics.length === 0 ? (
                    <div className="info-banner u-mt-2">
                        Nu exista rubrici configurate in acest moment. Contacteaza echipa editoriala pentru a continua.
                    </div>
                ) : null}
                {firstError ? <div className="info-banner u-mt-2">{firstError}</div> : null}
                <form className="form-grid u-mt-3" onSubmit={handleSubmit}>
                    <label className="span-2">
                        <span>Titlu articol</span>
                        <input name="title" value={form.data.title} onChange={handleFieldChange} required disabled={editorDisabled} />
                    </label>

                    <div className="article-meta-grid span-2">
                        <label>
                            <span>Tag articol</span>
                            <input name="tag" value={form.data.tag} onChange={handleFieldChange} required disabled={editorDisabled} />
                        </label>
                        <label>
                            <span>Rubrica</span>
                            <select name="topic_id" value={form.data.topic_id} onChange={handleFieldChange} disabled={editorDisabled}>
                                {topics.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="span-2 form-field-block">
                        <span className="field-label">Continut</span>
                        <div className="editor-wrapper" ref={editorWrapperRef}>
                            {toolbarFixedStyle ? <div aria-hidden className="editor-toolbar-spacer" style={{ height: `${toolbarHeight}px` }} /> : null}
                            <div
                                ref={toolbarRef}
                                className={`editor-toolbar ${toolbarFixedStyle ? 'editor-toolbar--fixed' : ''}`}
                                role="toolbar"
                                aria-label="Formatare text"
                                style={toolbarFixedStyle ?? undefined}
                            >
                                <button type="button" className={toolbarState.bold ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('bold'); } }} disabled={editorDisabled}>
                                    <FiBold />
                                </button>
                                <button type="button" className={toolbarState.italic ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('italic'); } }} disabled={editorDisabled}>
                                    <FiItalic />
                                </button>
                                <button type="button" className={toolbarState.underline ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('underline'); } }} disabled={editorDisabled}>
                                    <FiUnderline />
                                </button>
                                <button type="button" className={toolbarState.strike ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('strikeThrough'); } }} disabled={editorDisabled}>
                                    <FiScissors />
                                </button>
                                <button type="button" className={toolbarState.unorderedList ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('insertUnorderedList'); } }} disabled={editorDisabled}>
                                    <FiList />
                                </button>
                                <button type="button" className={toolbarState.heading ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('formatBlock', 'H3'); } }} disabled={editorDisabled}>
                                    <FiType /> Intertitlu
                                </button>
                                <button type="button" onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('formatBlock', 'P'); } }} disabled={editorDisabled}>
                                    Text normal
                                </button>
                            </div>
                            <div
                                className="rich-editor"
                                contentEditable={!editorDisabled}
                                ref={editorRef}
                                onInput={handleEditorInput}
                                onPaste={handleEditorPaste}
                                suppressContentEditableWarning
                                aria-label="Editor articol"
                            />
                        </div>
                    </div>

                    <label className="span-2">
                        <span>Imagine reprezentativa (JPG/PNG, maxim 1200px latime)</span>
                        <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} disabled={editorDisabled} />
                        {imagePreview ? (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Previzualizare imagine articol" />
                            </div>
                        ) : null}
                    </label>

                    <div className="row article-form-actions">
                        <button className="btn primary" type="submit" disabled={editorDisabled}>
                            {form.processing ? 'Se trimite...' : submitLabel}
                        </button>
                        <Link className="btn" href={route('psychologists.dashboard', { section: 'articles' })}>
                            Renunta
                        </Link>
                    </div>
                </form>
            </section>
        </>
    );
}
