import styles from './MDXContent.module.css'

interface MDXContentProps {
  content: any
}

export function MDXContent({ content }: MDXContentProps) {
  // Content Collections compiles MDX to a React component
  const Component = content.mdx
  
  return (
    <div className={styles.content}>
      <Component 
        components={{
          h1: (props: any) => <h1 className={styles.h1} {...props} />,
          h2: (props: any) => <h2 className={styles.h2} {...props} />,
          h3: (props: any) => <h3 className={styles.h3} {...props} />,
          h4: (props: any) => <h4 className={styles.h4} {...props} />,
          p: (props: any) => <p className={styles.paragraph} {...props} />,
          ul: (props: any) => <ul className={styles.unorderedList} {...props} />,
          ol: (props: any) => <ol className={styles.orderedList} {...props} />,
          li: (props: any) => <li className={styles.listItem} {...props} />,
          a: ({ href, ...props }: any) => (
            <a 
              className={styles.link}
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            />
          ),
          code: ({ inline, ...props }: any) => (
            inline 
              ? <code className={styles.inlineCode} {...props} />
              : <code className={styles.codeBlock} {...props} />
          ),
          pre: (props: any) => <pre className={styles.preBlock} {...props} />,
          blockquote: (props: any) => <blockquote className={styles.blockquote} {...props} />,
          strong: (props: any) => <strong className={styles.strong} {...props} />,
          em: (props: any) => <em className={styles.emphasis} {...props} />,
        }}
      />
    </div>
  )
}