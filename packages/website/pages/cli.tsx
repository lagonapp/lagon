import Text from 'lib/components/Text';
import useVerificationCode from 'lib/hooks/useVerificationCode';
import toast from 'react-hot-toast';
import LayoutTitle from 'lib/components/LayoutTitle';
import { GetStaticProps } from 'next';
import { getLocaleProps, useI18n } from 'locales';

const CLI = () => {
  const { data } = useVerificationCode();
  const { scopedT } = useI18n();
  const t = scopedT('cli');

  const copyCode = async () => {
    await navigator.clipboard.writeText(data?.code || '');
    toast.success(t('copy.success'));
  };

  return (
    <LayoutTitle title={t('title')}>
      <div className="flex items-center justify-center flex-col gap-6 mt-16 max-w-xs text-center mx-auto">
        <Text>{t('description')}</Text>
        <div>
          <button
            type="button"
            onClick={copyCode}
            className="text-stone-800 dark:text-stone-200 text-2xl font-semibold border border-stone-300 dark:border-stone-600 px-4 py-2 rounded-lg transition bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 dark:active:bg-stone-600"
          >
            {data?.code}
          </button>
          <Text size="sm">{t('copy')}</Text>
        </div>
      </div>
    </LayoutTitle>
  );
};

CLI.title = 'Log in to the CLI';

export const getStaticProps: GetStaticProps = getLocaleProps();

export default CLI;
