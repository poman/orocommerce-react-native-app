import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { HtmlStyles } from '@/src/constants/theme';

interface HtmlRendererProps {
  html: string;
  baseStyle?: TextStyle;
}

/**
 * Parses HTML and renders it with native components
 * Strips classes, styles, and applies custom styling
 */

function cleanHtml(html: string): string {
  let cleaned = html;

  // Remove class attributes
  cleaned = cleaned.replace(/\s*class="[^"]*"/gi, '');

  // Remove style attributes
  cleaned = cleaned.replace(/\s*style="[^"]*"/gi, '');

  // Remove id attributes
  cleaned = cleaned.replace(/\s*id="[^"]*"/gi, '');

  // Remove data attributes
  cleaned = cleaned.replace(/\s*data-[^=]*="[^"]*"/gi, '');

  return cleaned;
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&hellip;/g, '…');
}

function parseHtml(html: string): Array<{ type: string; content: string; children?: any[] }> {
  const cleaned = cleanHtml(html);
  const elements: Array<{ type: string; content: string; children?: any[] }> = [];

  const tagRegex = /<(\/?)([\w]+)([^>]*)>/g;
  let lastIndex = 0;
  let match;
  const stack: Array<{ type: string; children: any[] }> = [];

  while ((match = tagRegex.exec(cleaned)) !== null) {
    const [fullMatch, isClosing, tagName] = match;
    const textBefore = cleaned.substring(lastIndex, match.index);

    if (textBefore.trim()) {
      const target = stack.length > 0 ? stack[stack.length - 1].children : elements;
      target.push({ type: 'text', content: decodeHtmlEntities(textBefore.trim()) });
    }

    if (isClosing === '/') {
      if (stack.length > 0 && stack[stack.length - 1].type === tagName.toLowerCase()) {
        const element = stack.pop()!;
        const target = stack.length > 0 ? stack[stack.length - 1].children : elements;
        target.push(element);
      }
    } else {
      const lowerTag = tagName.toLowerCase();
      if (
        [
          'p',
          'div',
          'ul',
          'ol',
          'li',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'strong',
          'b',
          'em',
          'i',
          'br',
        ].includes(lowerTag)
      ) {
        if (lowerTag === 'br') {
          const target = stack.length > 0 ? stack[stack.length - 1].children : elements;
          target.push({ type: 'br', content: '' });
        } else {
          stack.push({ type: lowerTag, children: [] });
        }
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  const remainingText = cleaned.substring(lastIndex);
  if (remainingText.trim()) {
    const target = stack.length > 0 ? stack[stack.length - 1].children : elements;
    target.push({ type: 'text', content: decodeHtmlEntities(remainingText.trim()) });
  }

  while (stack.length > 0) {
    const element = stack.pop()!;
    const target = stack.length > 0 ? stack[stack.length - 1].children : elements;
    target.push(element);
  }

  return elements;
}

function renderElement(element: any, index: number): React.ReactNode {
  if (element.type === 'text') {
    return element.content;
  }

  if (element.type === 'br') {
    return '\n';
  }

  const children = element.children || [];

  switch (element.type) {
    case 'p':
      return (
        <Text key={index} style={styles.paragraph}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'div':
      return (
        <Text key={index} style={styles.div}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'h1':
      return (
        <Text key={index} style={styles.h1}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'h2':
      return (
        <Text key={index} style={styles.h2}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'h3':
      return (
        <Text key={index} style={styles.h3}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <Text key={index} style={styles.h4}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'ul':
    case 'ol':
      return (
        <View key={index} style={styles.list}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </View>
      );

    case 'li':
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>• </Text>
          <Text style={styles.listItemText}>
            {children.map((child: any, i: number) => renderElement(child, i))}
          </Text>
        </View>
      );

    case 'strong':
    case 'b':
      return (
        <Text key={index} style={styles.bold}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    case 'em':
    case 'i':
      return (
        <Text key={index} style={styles.italic}>
          {children.map((child: any, i: number) => renderElement(child, i))}
        </Text>
      );

    default:
      // Wrap in Text to avoid "text node as child of View" error
      if (children.length > 0) {
        return (
          <Text key={index} style={styles.text}>
            {children.map((child: any, i: number) => renderElement(child, i))}
          </Text>
        );
      }
      return null;
  }
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({ html, baseStyle }) => {
  if (!html) {
    return <Text style={[styles.text, baseStyle]}>No description available</Text>;
  }

  const elements = parseHtml(html);

  return (
    <View style={styles.container}>
      {elements.map((element, index) => {
        const rendered = renderElement(element, index);
        if (typeof rendered === 'string') {
          return (
            <Text key={index} style={styles.text}>
              {rendered}
            </Text>
          );
        }
        return rendered;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: HtmlStyles.text,
  paragraph: HtmlStyles.paragraph,
  div: HtmlStyles.div,
  h1: HtmlStyles.h1,
  h2: HtmlStyles.h2,
  h3: HtmlStyles.h3,
  h4: HtmlStyles.h4,
  list: HtmlStyles.list,
  listItem: {
    flexDirection: 'row',
    ...HtmlStyles.listItem,
  },
  bullet: HtmlStyles.bullet,
  listItemText: {
    flex: 1,
    ...HtmlStyles.listItemText,
  },
  bold: HtmlStyles.bold,
  italic: HtmlStyles.italic,
});
