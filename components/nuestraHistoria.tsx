function NuestraHistoria() {
  return (
    <section className="h-screen flex justify-center items-center">
      <div className="hidden lg:flex relative w-[90vw] h-[40vh] lg:w-[90vw] lg:h-[70vh] xl:w-[85vw] xl:h-[90vh]">
        <img
          src="/images/history1.webp"
          className="absolute inset-0 h-full w-full object-cover rounded-4xl"
        />
      </div>
      <div className="lg:hidden relative w-[90vw] h-[80vh] lg:w-[90vw] lg:h-[70vh] xl:w-[85vw] xl:h-[90vh]">
        <img
          src="/images/history2.webp"
          className="absolute inset-0 h-full w-full object-cover rounded-4xl"
        />
      </div>
    </section>
  );
}

export default NuestraHistoria;
