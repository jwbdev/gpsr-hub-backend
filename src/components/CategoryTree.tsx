import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import './CategoryTree.css';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

interface CategoryTreeProps {
  categories: Category[];
  onSelectCategory: (id: string) => void;
}

export default function CategoryTree({ categories, onSelectCategory }: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from flat array
  const categoryTree = useMemo(() => {
    const buildTree = (parentId: string | null = null): CategoryWithChildren[] => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };
    return buildTree();
  }, [categories]);

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTree = (nodes: CategoryWithChildren[], level = 0): React.ReactNode => {
    if (nodes.length === 0) return null;

    return (
      <ul className={`category-tree-list ${level === 0 ? 'category-tree-root' : ''}`}>
        {nodes.map((node) => {
          const isExpanded = expandedNodes.has(node.id);
          const hasChildren = node.children.length > 0;

          return (
            <li key={node.id} className="category-tree-item">
              <div className="category-tree-node">
                {hasChildren ? (
                  <button
                    onClick={() => toggleNode(node.id)}
                    className="category-tree-toggle"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="category-tree-spacer" />
                )}
                
                <span className="category-tree-icon">
                  {hasChildren && isExpanded ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                </span>

                <button
                  onClick={() => onSelectCategory(node.id)}
                  className="category-tree-label"
                  title={node.description || node.name}
                >
                  {node.name}
                </button>
              </div>

              {hasChildren && isExpanded && (
                <div className="category-tree-children">
                  {renderTree(node.children, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  if (categoryTree.length === 0) {
    return (
      <div className="category-tree-empty">
        <Folder className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground text-center">No categories available</p>
      </div>
    );
  }

  return (
    <div className="category-tree">
      {renderTree(categoryTree)}
    </div>
  );
}