const addBgcTransaction = () => {
  document.documentElement.classList.toggle('transaction-bgc');
};

export default function initApp() {
  // to prevent transcation happen during fp
  setTimeout(addBgcTransaction);
}
