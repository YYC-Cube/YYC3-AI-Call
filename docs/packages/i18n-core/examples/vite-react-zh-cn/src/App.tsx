import { useState, useEffect } from 'react';
import { t, setLocale, isChineseLocale } from '@yyc3/i18n-core';
import { setupI18n } from './i18n';
import type { Locale } from '@yyc3/i18n-core';

function App() {
  const [locale, setLocaleState] = useState<Locale>('zh-CN');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setupI18n().then(() => {
      setInitialized(true);
    });
  }, []);

  const switchLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const features = [
    { key: 'zeroDeps', icon: '📦' },
    { key: 'pluginSystem', icon: '🧩' },
    { key: 'security', icon: '🛡️' },
    { key: 'chineseFirst', icon: '🇨🇳' },
    { key: 'performance', icon: '⚡' },
    { key: 'typescript', icon: '💎' },
  ];

  if (!initialized) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ color: '#00d4ff' }}>{t('common.loading')}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="logo">🦞 YYC³ i18n-core</div>
        <p className="subtitle">{t('hero.subtitle')}</p>

        <div className="lang-switcher">
          <button
            onClick={() => switchLanguage('zh-CN')}
            style={{
              opacity: locale === 'zh-CN' ? 1 : 0.6,
              fontWeight: locale === 'zh-CN' ? 'bold' : 'normal',
            }}
          >
            🇨🇳 简体中文
          </button>
          <button
            onClick={() => switchLanguage('en')}
            className="outline"
            style={{
              opacity: locale === 'en' ? 1 : 0.6,
              fontWeight: locale === 'en' ? 'bold' : 'normal',
            }}
          >
            🇺🇸 English
          </button>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem' }}>
          {t('demo.currentLocale', { locale })}
        </p>
      </header>

      <section className="features-grid">
        {features.map(({ key, icon }) => (
          <div key={key} className="feature-card">
            <h3>{icon} {t(`features.${key}.title`)}</h3>
            <p>{t(`features.${key}.desc`)}</p>
          </div>
        ))}
      </section>

      <section className="demo-section">
        <h2>💡 使用示例 | Usage Examples</h2>

        <div className="demo-item">
          <strong>基础翻译:</strong> <code>{t('demo.greeting', { name: '开发者' })}</code>
        </div>

        <div className="demo-item">
          <strong>复数处理:</strong> <code>{t('demo.itemCount', { count: 42 })}</code>
        </div>

        <div className="demo-item">
          <strong>中文检测:</strong>{' '}
          <code>
            isChineseLocale('{locale}') = {isChineseLocale(locale) ? 'true' : 'false'}
          </code>
        </div>

        <div className="demo-item">
          <strong>嵌套键访问:</strong>{' '}
          <code>{t('common.appName')} + {t('common.version')}</code>
        </div>
      </section>

      <footer className="footer">
        <p>
          Built with ❤️ using{' '}
          <a
            href="https://github.com/YanYuCloudCube/yyc3-i18n-core"
            style={{ color: '#00d4ff' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            @yyc3/i18n-core v2.0
          </a>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          🌐 当前语言: {locale} | 检测到中文环境:{' '}
          {isChineseLocale(locale) ? '✅ 是' : '❌ 否'}
        </p>
      </footer>
    </div>
  );
}

export default App;
