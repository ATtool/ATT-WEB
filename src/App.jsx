import React, { useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { ChromeProvider } from './context/ChromeContext.jsx';
import { RouterProvider, useRouter } from './router.jsx';
import Layout from './components/Layout.jsx';
import Home from './screens/Home.jsx';
import SongsHub from './screens/SongsHub.jsx';
import ZionScreen from './screens/ZionScreen.jsx';
import ThirumaraiScreen, { ThirumaraiHub } from './screens/ThirumaraiScreen.jsx';
import SongPage from './screens/SongPage.jsx';
import BooksScreen from './screens/BooksScreen.jsx';
import BookDetail from './screens/BookDetail.jsx';
import { MannaList, MannaReader } from './screens/Manna.jsx';
import { SabbathList, SabbathLesson, SabbathDay } from './screens/Sabbath.jsx';
import Magazines from './screens/Magazines.jsx';
import Settings from './screens/Settings.jsx';
import About from './screens/About.jsx';
import NotFound from './screens/NotFound.jsx';

function Screen() {
  const { route, path } = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  switch (route.name) {
    case 'home':
      return <Home />;
    case 'songs':
      return <SongsHub />;
    case 'zion':
      return <ZionScreen />;
    case 'zionCategory':
      return <ZionScreen categorySlug={route.slug} />;
    case 'thirumarai':
      return <ThirumaraiHub />;
    case 'thirumaraiList':
      return <ThirumaraiScreen variant={route.variant} />;
    case 'song':
      return <SongPage />;
    case 'books':
      return <BooksScreen />;
    case 'book':
      return <BookDetail />;
    case 'mannaList':
      return <MannaList />;
    case 'manna':
      return <MannaReader />;
    case 'sabbathList':
      return <SabbathList />;
    case 'sabbathLesson':
      return <SabbathLesson />;
    case 'sabbathDay':
      return <SabbathDay />;
    case 'magazines':
      return <Magazines />;
    case 'settings':
      return <Settings />;
    case 'about':
      return <About />;
    default:
      return <NotFound />;
  }
}

export default function App({ initialPath = '/', initialData = {} }) {
  return (
    <SettingsProvider>
      <DataProvider initial={initialData}>
        <ChromeProvider>
          <RouterProvider initialPath={initialPath}>
            <Layout>
              <Screen />
            </Layout>
          </RouterProvider>
        </ChromeProvider>
      </DataProvider>
    </SettingsProvider>
  );
}
