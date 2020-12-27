const ENLARGING_BLOCK = [ ' ' , '▏' , '▎' , '▍' , '▌' , '▋' , '▊' , '▉' , '█' ];

export function staticProgress(percentage, width)
{
    let output = "";
    let relativeSize = percentage / 100 * (width - 1);
    output = ENLARGING_BLOCK[8].repeat(Math.floor(relativeSize));
    output += ENLARGING_BLOCK[Math.floor((relativeSize * 9) % 9)];
    output += ENLARGING_BLOCK[0].repeat(width - output.length);
    return output;
}