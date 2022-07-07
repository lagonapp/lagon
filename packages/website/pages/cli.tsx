import Layout from 'lib/Layout';
import Text from 'lib/components/Text';
import useVerificationCode from 'lib/hooks/useVerificationCode';
import toast from 'react-hot-toast';

const CLI = () => {
  const { data } = useVerificationCode();

  const copyCode = async () => {
    await navigator.clipboard.writeText(data?.code || '');
    toast.success('Copied to clipboard!');
  };

  return (
    <Layout title="Log in to the CLI">
      <div className="flex items-center justify-center flex-col gap-6 mt-16 max-w-xs text-center mx-auto">
        <Text>This is your verification code to login in the CLI. Copy it and paste it in your terminal.</Text>
        <div>
          <button
            type="button"
            onClick={copyCode}
            className="text-stone-800 dark:text-stone-200 text-2xl font-semibold border border-stone-300 dark:border-stone-600 px-4 py-2 rounded-lg transition bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 dark:active:bg-stone-600"
          >
            {data?.code}
          </button>
          <Text size="sm">Click to copy</Text>
        </div>
      </div>
    </Layout>
  );
};

export default CLI;
