import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/Layout.module.css";

const navItems = [
  {
    section: "메인",
    items: [
      { href: "/", label: "대시보드", icon: "📊" },
    ],
  },
  {
    section: "관리",
    items: [
      { href: "/business", label: "사업자 기본정보", icon: "🏢" },
      { href: "/contracts", label: "계약관리", icon: "📋" },
      { href: "/finance", label: "자금관리", icon: "💰" },
      { href: "/customers", label: "문의/고객관리", icon: "👥" },
      { href: "/government", label: "정부지원사업", icon: "🏛️" },
    ],
  },
  {
    section: "설정",
    items: [
      { href: "/accounts", label: "계정관리", icon: "🔐" },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const currentPath = router.pathname;

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarLogo}>
          <h2>WHYDLAB BIZ</h2>
        </div>
        <nav className={styles.sidebarNav}>
          {navItems.map((section) => (
            <div key={section.section} className={styles.navSection}>
              <div className={styles.navLabel}>{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${
                    currentPath === item.href ? styles.navItemActive : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuButton}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <span className={styles.pageTitle}>
              {navItems
                .flatMap((s) => s.items)
                .find((item) => item.href === currentPath)?.label ?? ""}
            </span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.profileBadge}>W</div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
