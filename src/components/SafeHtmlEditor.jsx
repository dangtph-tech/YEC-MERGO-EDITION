import React, { useRef, useEffect, useState } from 'react';
import { 
  Undo2, Redo2, Bold, Italic, Underline, Baseline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, IndentDecrease, IndentIncrease, RemoveFormatting
} from 'lucide-react';

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
  '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
  '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'
];

const SafeHtmlEditor = ({ value, onChange }) => {
  const iframeRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const initIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    const htmlContent = value || '<html style="font-family: sans-serif; height: 100%;"><body style="margin:0; padding:12px; height: 100%;"><p><br></p></body></html>';
    doc.write(htmlContent);
    doc.close();

    doc.designMode = "on";

    const handleInput = () => {
      onChange(doc.documentElement.outerHTML);
    };

    doc.body.addEventListener('input', handleInput);
    doc.body.addEventListener('keyup', handleInput);
  };

  useEffect(() => {
    initIframe();
  }, []); 

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc && value) {
      if (document.activeElement !== iframeRef.current) {
        initIframe();
      }
    }
  }, [value]);

  const execCmd = (cmd, arg = null) => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.execCommand(cmd, false, arg);
      iframeRef.current.focus();
      onChange(doc.documentElement.outerHTML);
    }
  };

  const handleColorClick = (type, hex) => {
    execCmd(type, hex);
    setShowColorPicker(false);
  };

  // Gmail UI Styles
  const toolbarContainerStyle = {
    padding: '6px 16px', background: '#f2f6fc', borderRadius: '24px', 
    display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px'
  };
  
  const iconBtnStyle = {
    padding: '6px', background: 'transparent', border: 'none', borderRadius: '4px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#444'
  };

  const selectStyle = { 
    padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#444' 
  };

  const dividerStyle = { width: '1px', height: '20px', background: '#d1d1d1', margin: '0 6px' };

  return (
    <div style={{ background: '#fff', overflow: 'visible', position: 'relative' }}>
      
      {/* Gmail-style Floating Toolbar */}
      <div style={toolbarContainerStyle}>
        <button onClick={() => execCmd('undo')} style={iconBtnStyle} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
        <button onClick={() => execCmd('redo')} style={iconBtnStyle} title="Redo (Ctrl+Y)"><Redo2 size={16} /></button>
        
        <select style={selectStyle} onChange={(e) => execCmd('fontName', e.target.value)} title="Font">
          <option value="sans-serif">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="'Times New Roman'">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Tahoma">Tahoma</option>
        </select>

        <div style={dividerStyle}></div>

        <select style={selectStyle} onChange={(e) => execCmd('fontSize', e.target.value)} title="Size">
          <option value="3">Vừa</option>
          <option value="1">Nhỏ</option>
          <option value="5">Lớn</option>
          <option value="7">Rất Lớn</option>
        </select>

        <div style={dividerStyle}></div>

        <button onClick={() => execCmd('bold')} style={iconBtnStyle} title="Bold"><Bold size={16} /></button>
        <button onClick={() => execCmd('italic')} style={iconBtnStyle} title="Italic"><Italic size={16} /></button>
        <button onClick={() => execCmd('underline')} style={iconBtnStyle} title="Underline"><Underline size={16} /></button>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowColorPicker(!showColorPicker)} style={iconBtnStyle} title="Text Color">
            <Baseline size={16} />
            <div style={{width: '0', height: '0', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: '4px solid #444', marginLeft: '4px'}}></div>
          </button>

          {showColorPicker && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', padding: '12px',
              border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex', gap: '16px'
            }}>
              <div>
                <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Màu nền</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 16px)', gap: '2px' }}>
                  {COLORS.map(c => <div key={'bg'+c} onClick={() => handleColorClick('hiliteColor', c)} style={{width:'16px', height:'16px', background: c, cursor:'pointer', border: c==='#FFFFFF' ? '1px solid #ccc' : 'none'}}/>)}
                </div>
              </div>
              <div style={{width: '1px', background: '#eee'}}></div>
              <div>
                <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Màu văn bản</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 16px)', gap: '2px' }}>
                  {COLORS.map(c => <div key={'fg'+c} onClick={() => handleColorClick('foreColor', c)} style={{width:'16px', height:'16px', background: c, cursor:'pointer', border: c==='#FFFFFF' ? '1px solid #ccc' : 'none'}}/>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={dividerStyle}></div>

        <button onClick={() => execCmd('justifyLeft')} style={iconBtnStyle} title="Align Left"><AlignLeft size={16} /></button>
        <button onClick={() => execCmd('justifyCenter')} style={iconBtnStyle} title="Align Center"><AlignCenter size={16} /></button>
        <button onClick={() => execCmd('justifyRight')} style={iconBtnStyle} title="Align Right"><AlignRight size={16} /></button>
        <button onClick={() => execCmd('justifyFull')} style={iconBtnStyle} title="Justify"><AlignJustify size={16} /></button>

        <div style={dividerStyle}></div>
        
        <button onClick={() => execCmd('insertOrderedList')} style={iconBtnStyle} title="Numbered List"><ListOrdered size={16} /></button>
        <button onClick={() => execCmd('insertUnorderedList')} style={iconBtnStyle} title="Bulleted List"><List size={16} /></button>
        <button onClick={() => execCmd('outdent')} style={iconBtnStyle} title="Decrease Indent"><IndentDecrease size={16} /></button>
        <button onClick={() => execCmd('indent')} style={iconBtnStyle} title="Increase Indent"><IndentIncrease size={16} /></button>
        
        <div style={dividerStyle}></div>
        <button onClick={() => execCmd('removeFormat')} style={iconBtnStyle} title="Remove Formatting"><RemoveFormatting size={16} /></button>
      </div>
      
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <iframe 
          ref={iframeRef} 
          style={{ width: '100%', height: '480px', border: 'none', background: 'white', display: 'block' }}
          title="Email Visual Editor"
        />
      </div>
    </div>
  );
};

export default SafeHtmlEditor;
