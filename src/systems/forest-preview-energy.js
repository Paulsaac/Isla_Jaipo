// Reconstruye la respuesta al audio al saltar, incluso con reproducción pausada.
// FFT pequeña sobre el buffer ya decodificado; solo se ejecuta durante un seek.
export function getBufferedForestEnergy(buffer,seconds) {
    const size=1024,real=new Float64Array(size),imag=new Float64Array(size);
    const spectrum=new Float64Array(size/2),window=new Float64Array(size);
    for(let i=0;i<size;i++)window[i]=.42-.5*Math.cos(2*Math.PI*i/size)+.08*Math.cos(4*Math.PI*i/size);
    const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
    const energy={bass:0,treble:0},step=1/30,response=1-Math.exp(-step*8);
    const binHz=buffer.sampleRate/size;
    for(let frame=24;frame>=0;frame--) {
        const end=Math.floor((seconds-frame*step)*buffer.sampleRate);
        real.fill(0);imag.fill(0);
        for(let i=0;i<size;i++) {
            const sample=end-size+i;
            if(sample<0||sample>=buffer.length)continue;
            let value=0;for(const channel of channels)value+=channel[sample];
            real[i]=value/channels.length*window[i];
        }
        for(let i=1,j=0;i<size;i++) {
            let bit=size>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
            if(i<j)[real[i],real[j]]=[real[j],real[i]];
        }
        for(let length=2;length<=size;length<<=1) {
            const angle=-2*Math.PI/length,cos=Math.cos(angle),sin=Math.sin(angle);
            for(let begin=0;begin<size;begin+=length) {
                let wr=1,wi=0;
                for(let i=0;i<length/2;i++) {
                    const a=begin+i,b=a+length/2;
                    const r=real[b]*wr-imag[b]*wi,im=real[b]*wi+imag[b]*wr;
                    real[b]=real[a]-r;imag[b]=imag[a]-im;real[a]+=r;imag[a]+=im;
                    const next=wr*cos-wi*sin;wi=wr*sin+wi*cos;wr=next;
                }
            }
        }
        for(let i=0;i<spectrum.length;i++)spectrum[i]=spectrum[i]*.65+Math.hypot(real[i],imag[i])/size*.35;
        function band(low,high) {
            const begin=Math.max(1,Math.ceil(low/binHz)),end=Math.min(spectrum.length,Math.ceil(high/binHz));
            let total=0;
            for(let i=begin;i<end;i++)total+=Math.max(0,Math.min(1,(20*Math.log10(Math.max(1e-12,spectrum[i]))+100)/70));
            return total/Math.max(1,end-begin);
        }
        energy.bass+=(band(45,250)-energy.bass)*response;
        energy.treble+=(band(1800,6000)-energy.treble)*response;
    }
    return energy;
}
