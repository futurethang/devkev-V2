import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import styles from './MDXContent.module.css'

interface MDXContentProps {
  content: any
}

export function MDXContent({ content }: MDXContentProps) {
  return (
    <div className={styles.content}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ node, ...props }: any) => <h1 className={styles.h1} {...props} />,
          h2: ({ node, ...props }: any) => <h2 className={styles.h2} {...props} />,
          h3: ({ node, ...props }: any) => <h3 className={styles.h3} {...props} />,
          h4: ({ node, ...props }: any) => <h4 className={styles.h4} {...props} />,
          p: ({ node, ...props }: any) => <p className={styles.paragraph} {...props} />,
          ul: ({ node, ...props }: any) => <ul className={styles.unorderedList} {...props} />,
          ol: ({ node, ...props }: any) => <ol className={styles.orderedList} {...props} />,
          li: ({ node, ...props }: any) => <li className={styles.listItem} {...props} />,
          a: ({ node, href, ...props }: any) => (
            <a 
              className={styles.link}
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            />
          ),
          code: ({ node, inline, ...props }: any) => (
            inline 
              ? <code className={styles.inlineCode} {...props} />
              : <code className={styles.codeBlock} {...props} />
          ),
          pre: ({ node, ...props }: any) => <pre className={styles.preBlock} {...props} />,
          blockquote: ({ node, ...props }: any) => <blockquote className={styles.blockquote} {...props} />,
          strong: ({ node, ...props }: any) => <strong className={styles.strong} {...props} />,
          em: ({ node, ...props }: any) => <em className={styles.emphasis} {...props} />,
        }}
      >
        {content.raw}
      </ReactMarkdown>
    </div>
  )
}