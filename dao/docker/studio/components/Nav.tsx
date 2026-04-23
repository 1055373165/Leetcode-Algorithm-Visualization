import Link from 'next/link';

export const Nav: React.FC = () => {
  return (
    <header className="border-b border-paper-rule bg-paper-raised/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-3 group">
          <span className="font-serif text-2xl font-semibold tracking-tight text-paper-ink">
            Dao Studio
          </span>
          <span className="text-xs text-paper-inkFaint uppercase tracking-[0.1em]">
            深度技术视频工作室
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/">主题库</NavLink>
          <NavLink href="/new" highlight>+ 新建</NavLink>
          <NavLink href="/prompts">提示词</NavLink>
          <NavLink href="/settings">设置</NavLink>
        </nav>
      </div>
    </header>
  );
};

const NavLink: React.FC<{ href: string; children: React.ReactNode; highlight?: boolean }> = ({
  href,
  children,
  highlight,
}) => (
  <Link
    href={href}
    className={
      'px-4 py-2 rounded-md text-sm font-medium transition-colors ' +
      (highlight
        ? 'bg-paper-accentWarm text-white hover:bg-paper-accentWarm/90'
        : 'text-paper-inkSoft hover:text-paper-ink hover:bg-paper-surface')
    }
  >
    {children}
  </Link>
);
