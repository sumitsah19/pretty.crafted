// Lightweight markup parser for admin-authored policy content (see backend
// Policy.java doc). Deliberately not full markdown and never uses
// dangerouslySetInnerHTML — every node is built as a real React element so
// there's no HTML-injection surface even though only admins can author this.
//
// Supported block syntax:
//   "## Heading text"   -> <h2>
//   "- item text"        -> <li> (consecutive "- " lines group into one <ul>)
//   blank line           -> ends the current paragraph/list
//   anything else        -> accumulates into a <p> (lines joined with a space)
//
// Supported inline syntax (applied within headings/paragraphs/list items):
//   "[label](url)"       -> <a href="url">label</a>
//   "**text**"            -> <strong>text</strong>

export function parsePolicyContent(content) {
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paraLines = []
  let listItems = null

  const flushPara = () => {
    if (paraLines.length) { blocks.push({ type: 'p', text: paraLines.join(' ') }); paraLines = [] }
  }
  const flushList = () => {
    if (listItems) { blocks.push({ type: 'ul', items: listItems }); listItems = null }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('## ')) {
      flushPara(); flushList()
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
    } else if (line.startsWith('- ')) {
      flushPara()
      if (!listItems) listItems = []
      listItems.push(line.slice(2).trim())
    } else if (line === '') {
      flushPara(); flushList()
    } else {
      flushList()
      paraLines.push(line)
    }
  }
  flushPara(); flushList()
  return blocks
}

// Parses "[label](url)" and "**text**" within a single line of text into an
// array of strings / React nodes suitable for use as JSX children.
function renderInline(text, keyPrefix) {
  const tokens = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0, m, i = 0

  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      tokens.push(<a key={`${keyPrefix}-${i++}`} href={m[2]} style={{ color: '#C4704A', fontWeight: 600 }}>{m[1]}</a>)
    } else {
      tokens.push(<strong key={`${keyPrefix}-${i++}`}>{m[3]}</strong>)
    }
    last = re.lastIndex
  }
  if (last < text.length) tokens.push(text.slice(last))
  return tokens
}

export function renderPolicyBlocks(blocks) {
  return blocks.map((b, i) => {
    if (b.type === 'h2') {
      return (
        <h2 key={i} style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginTop: i === 0 ? 0 : 36, marginBottom: 12, color: '#2C1A0E' }}>
          {renderInline(b.text, `h${i}`)}
        </h2>
      )
    }
    if (b.type === 'ul') {
      return (
        <ul key={i} style={{ fontSize: 15, color: '#3D2510', lineHeight: 1.8, marginBottom: 14, paddingLeft: 22 }}>
          {b.items.map((it, j) => <li key={j} style={{ marginBottom: 6 }}>{renderInline(it, `${i}-${j}`)}</li>)}
        </ul>
      )
    }
    return (
      <p key={i} style={{ fontSize: 15, color: '#3D2510', lineHeight: 1.8, marginBottom: 14 }}>
        {renderInline(b.text, `p${i}`)}
      </p>
    )
  })
}
