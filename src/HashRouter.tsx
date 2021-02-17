import React from 'react';

interface Props {
    cp?: React.ReactElement<any, any>
    path?: string
    children?: any
}

let router = (()=>{
    let  prev:any = {}, setS:()=>void, loc:any = window.location,
    fs = ['host', 'hostname', 'href', 'origin', 'pathname', 'port', 'protocol', 'hash'];
    fs.map(it=>(prev[it]=loc[it]));
    
    window.addEventListener("hashchange", (ev) => {
        // console.log('hashchange', loc);
        if(prev.href !== loc.href){
            fs.map(it=>(prev[it]=loc[it]));
            setS && setS();
        }
    });
    let isMe = (path: string) => {
        // console.log('isMe', path, loc.hash);
        return loc.hash.indexOf('#!'+path)>=0 || loc.hash.indexOf('#'+path)>=0;
    }
    return ({
    Root: (props:Props) => {
        const [state, setState] = React.useState(false);
        setS = () => setState(!state);
        let found:any = null;
        props.children && props.children.map((it:any) => {
            if(isMe(it.props.path)){
                // console.log('Root', isMe(it.props.path), it.props.path, it);
                found = (<>{it.type(it.props)}</>);
            }
            return it;
        })
        return found;
    },
    Route: (props:Props) => {
        // console.log('Route', isMe(props.path!), props.path, loc.hash);
        return( isMe(props.path!)? <>{props.cp}</>:null );
    }
    });
})()

export let Route = router.Route;
export let HashRouter = router.Root;
export default router;
