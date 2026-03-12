import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/Layout.module.css";

interface SubItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  sub?: SubItem[];
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const navItems: NavSection[] = [
  {
    section: "메인",
    items: [
      { href: "/chat", label: "AI 비서", icon: "🤖" },
      { href: "/", label: "대시보드", icon: "📊" },
      { href: "/schedule", label: "통합일정", icon: "📅" },
    ],
  },
  {
    section: "관리",
    items: [
      {
        href: "/business",
        label: "사업자 기본정보",
        icon: "🏢",
        sub: [{ href: "/business/documents", label: "서류 보관함" }],
      },
      {
        href: "/sales",
        label: "영업",
        icon: "👥",
        sub: [
          { href: "/sales/inquiry", label: "문의폼" },
          { href: "/sales/requests", label: "의뢰" },
          { href: "/sales/clients", label: "고객" },
          { href: "/sales/quotes", label: "견적서" },
          { href: "/sales/templates", label: "메일템플릿" },
        ],
      },
      {
        href: "/contracts",
        label: "계약관리",
        icon: "📋",
        sub: [
          { href: "/contracts/overview", label: "계약현황관리" },
          { href: "/contracts/projects", label: "프로젝트 관리" },
          { href: "/contracts/hr", label: "HR 계약관리" },
          { href: "/contracts/outsource", label: "외주 계약관리" },
        ],
      },
      {
        href: "/finance",
        label: "자금관리",
        icon: "💰",
        sub: [
          { href: "/finance/fixed", label: "정기결제(고정비)" },
          { href: "/finance/payments", label: "프로젝트 수금" },
          { href: "/finance/salary", label: "월 급여관리" },
          { href: "/finance/tax", label: "세금계산서" },
        ],
      },
      { href: "/government", label: "정부지원사업", icon: "🏛️" },
      { href: "/accounts", label: "계정관리", icon: "🔐" },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const currentPath = router.pathname;

  const isActive = (href: string) =>
    currentPath === href || currentPath.startsWith(href + "/");

  const allItems = navItems.flatMap((s) => [
    ...s.items,
    ...s.items.flatMap((i) => i.sub ?? []),
  ]);

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
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${
                      isActive(item.href) ? styles.navItemActive : ""
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.label}
                  </Link>
                  {item.sub && isActive(item.href) && (
                    <div className={styles.subNav}>
                      {item.sub.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`${styles.subNavItem} ${
                            currentPath === sub.href
                              ? styles.subNavItemActive
                              : ""
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
              {allItems.find((item) => item.href === currentPath)?.label ?? ""}
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
